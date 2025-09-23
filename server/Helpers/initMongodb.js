import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

let isConnecting = false;

let hasAttemptedWarmup = false;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  if (isConnecting) {
    // Wait briefly for ongoing connection (up to 5s for Lambda cold starts)
    const start = Date.now();
    while (Date.now() - start < 5000 && mongoose.connection.readyState === 2) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 100));
    }
    return mongoose.connection.readyState === 1;
  }

  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.dbName;
  if (!mongoUri) {
    console.warn('MONGODB_URI is not set; skipping DB connect');
    return false;
  }

  try {
    isConnecting = true;
    console.log('Attempting MongoDB connection...');
    await mongoose.connect(mongoUri, {
      dbName,
      // Increased timeouts for Lambda cold starts
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 15000, // Increased from 10s to 15s
      socketTimeoutMS: 60000, // Increased from 45s to 60s
      connectTimeoutMS: 15000, // Added explicit connect timeout
      bufferCommands: false
      // Removed bufferMaxEntries as it's deprecated and not supported
    });
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    console.error('Connection details:', {
      uri: mongoUri ? 'PROVIDED' : 'MISSING',
      dbName,
      readyState: mongoose.connection.readyState
    });
    return false;
  } finally {
    isConnecting = false;
  }
};

export const ensureDbConnected = async (req, res, next) => {
  try {
    console.log(`ensureDbConnected: Starting for ${req.method} ${req.path}`);
    console.log(`Current connection state: ${mongoose.connection.readyState}`);
    console.log(`MongoDB URI exists: ${!!process.env.MONGODB_URI}`);
    console.log(`DB Name: ${process.env.dbName}`);
    
    // Check if environment variables are present
    if (!process.env.MONGODB_URI) {
      console.error('ensureDbConnected: MONGODB_URI not found in environment');
      return res.status(503).json({ 
        error: 'Database configuration missing',
        details: 'MONGODB_URI environment variable not set',
        timestamp: new Date().toISOString()
      });
    }
    
    // Try up to 3 attempts with longer waits for Lambda cold starts
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      console.log(`Connection attempt ${attempt}/3`);
      
      try {
        const ok = await connectDB();
        if (ok || mongoose.connection.readyState === 1) {
          console.log('Database connection successful, proceeding...');
          return next();
        }
      } catch (connectError) {
        console.error(`Connection attempt ${attempt} failed:`, connectError.message);
      }
      
      // If connecting (2), wait longer for Lambda cold starts
      if (mongoose.connection.readyState === 2) {
        console.log('Connection in progress, waiting...');
        const start = Date.now();
        while (Date.now() - start < 3000 && mongoose.connection.readyState === 2) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise(r => setTimeout(r, 200));
        }
        if (mongoose.connection.readyState === 1) {
          console.log('Connection established during wait, proceeding...');
          return next();
        }
      }
      
      // Longer backoff between attempts for Lambda
      if (attempt < 3) {
        const backoffTime = 500 * attempt;
        console.log(`Attempt ${attempt} failed, waiting ${backoffTime}ms before retry...`);
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, backoffTime));
      }
    }

    console.error('ensureDbConnected: All attempts failed', { 
      readyState: mongoose.connection.readyState,
      path: req.path,
      method: req.method,
      mongoUri: process.env.MONGODB_URI ? 'present' : 'missing',
      dbName: process.env.dbName
    });
    
    return res.status(503).json({ 
      error: 'Database unavailable',
      details: `Connection failed after 3 attempts. State: ${mongoose.connection.readyState}`,
      timestamp: new Date().toISOString(),
      debug: {
        mongoUriExists: !!process.env.MONGODB_URI,
        dbName: process.env.dbName,
        connectionState: mongoose.connection.readyState
      }
    });
  } catch (error) {
    console.error('ensureDbConnected error:', error);
    return res.status(503).json({ 
      error: 'Database middleware error',
      details: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
  }
};

// Warm-up helper to be called on cold start or via health
export const warmUpDb = async () => {
  if (hasAttemptedWarmup || mongoose.connection.readyState === 1) return;
  hasAttemptedWarmup = true;
  try {
    const ok = await connectDB();
    if (!ok) {
      // one more quick retry after short delay
      await new Promise(r => setTimeout(r, 300));
      await connectDB();
    }
  } catch (e) {
    // swallow; health/requests will retry
  }
};

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected...");
});

mongoose.connection.on("error", (err) => {
  console.log(err.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected...");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
});

export default connectDB;