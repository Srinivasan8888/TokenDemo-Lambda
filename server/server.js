import express from "express";
import cors from "cors";
import router from "./Routes/apiRoutes.js";
import morgan from "morgan";
import createError from "http-errors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {connectDB, ensureDbConnected, warmUpDb} from "./Helpers/initMongodb.js";
import {verifyAccessToken} from "./Helpers/generateJwt.js";
import getRedisClient, {ensureRedisConnection} from "./Helpers/initRedis.js";
import serverless from "serverless-http";

const app = express();
// Best-effort warm up DB on cold start
warmUpDb().catch(() => {});
app.use(morgan("dev"));
app.use(express.json());

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            "https://d1ub64c12thrp4.cloudfront.net",
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://127.0.0.1:3000"
        ];
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Log the rejected origin for debugging
        console.log('CORS rejected origin:', origin);
        return callback(null, false); // Don't throw error, just reject
    },
    methods: [
        "GET",
        "POST", 
        "PUT",
        "DELETE",
        "OPTIONS"
    ],
    allowedHeaders: [
        "Content-Type", 
        "Authorization"
    ],
    credentials: true
}));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${
        req.method
    } ${
        req.path
    } - Body:`, req.body);
    next();
});

// env file
dotenv.config();
// Avoid top-level DB connect in Lambda; connect lazily when needed

const PORT = process.env.PORT || 4000;
// let isConnected = false;
// //mongodb connection happens inside initMongodb on import
// const connectToDatabase = async () => {
// if (isConnected && mongoose.connection.readyState === 1) {
//       console.log('Already connected to MongoDB');
//       return true;
// }
// connectToDatabase();
// try {
//       const mongoUri = process.env.MONGODB_URI;
//       const dbName = process.env.dbName || 'tokenDemo';

//       console.log('Attempting to connect to MongoDB...');
//       console.log('MongoDB URI:', mongoUri ? `${
//           mongoUri.split('@')[0]
//       }@***` : 'NOT PROVIDED');
//       console.log('Database name:', dbName);

//       if (! mongoUri) {
//           console.log('MongoDB URI not provided');
//           throw new Error('MONGODB_URI environment variable is required');
//       }

//       await mongoose.connect(mongoUri, {
//           dbName: dbName,
//           serverSelectionTimeoutMS: 10000,
//           socketTimeoutMS: 45000,
//           maxPoolSize: 10,
//           bufferCommands: false
//       });

//       isConnected = true;
//       console.log('Connected to MongoDB successfully');
//       console.log('Connection state:', mongoose.connection.readyState);
//       console.log('Database name:', mongoose.connection.db.databaseName);
//       return true;
// } catch (error) {
//       console.error('MongoDB connection error:', error.message);
//       console.error('Connection details:', {
//           uri: process.env.MONGODB_URI ? 'PROVIDED' : 'MISSING',
//           dbName: process.env.dbName,
//           readyState: mongoose.connection.readyState
//       });
//       isConnected = false;
//       return false;
// }
// };
// http://34.100.135.94:4000
app.get("/", async (req, res, next) => {
    res.send("From server - Lambda is working!");
});

// Test endpoint without DB connection
app.post("/test-login", async (req, res) => {
    res.json({
        message: "Test endpoint working",
        body: req.body,
        timestamp: new Date().toISOString(),
        environment: process.env.AWS_LAMBDA_FUNCTION_NAME ? 'lambda' : 'local'
    });
});

// Simple test endpoint for CORS debugging
app.get("/test-cors", (req, res) => {
    res.json({
        message: "CORS test successful",
        origin: req.get('Origin') || 'No origin header',
        timestamp: new Date().toISOString()
    });
});

// Test DB connection endpoint
app.get("/test-db", async (req, res) => {
    try {
        console.log('Testing DB connection...');
        console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
        console.log('DB Name:', process.env.dbName);

        const {connectDB} = await import ('./Helpers/initMongodb.js');
        const connected = await connectDB();

        res.json({
            connected,
            connectionState: mongoose.connection.readyState,
            dbName: process.env.dbName,
            mongoUriExists: !!process.env.MONGODB_URI,
            error: null
        });
    } catch (error) {
        console.error('Test DB error:', error);
        res.json({connected: false, connectionState: mongoose.connection.readyState, error: error.message, stack: error.stack});
    }
});

// Test login endpoint with detailed debugging
app.post("/test-login-debug", async (req, res) => {
    try {
        console.log('=== DEBUG LOGIN TEST ===');
        console.log('Request body:', req.body);
        console.log('Environment check:');
        console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
        console.log('- ACCESS_SECRET_KEY exists:', !!process.env.ACCESS_SECRET_KEY);
        console.log('- REFRESH_SECRET_KEY exists:', !!process.env.REFRESH_SECRET_KEY);
        console.log('- DB connection state:', mongoose.connection.readyState);

        const {username, password} = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                received: {
                    username: !!username,
                    password: !!password
                }
            });
        }

        // Test DB connection
        const {connectDB} = await import ('./Helpers/initMongodb.js');
        const dbConnected = await connectDB();
        console.log('DB connection result:', dbConnected);

        if (! dbConnected) {
            return res.status(503).json({error: 'Database connection failed', connectionState: mongoose.connection.readyState});
        }

        // Test user lookup
        const userModel = (await import ('./Models/UserModel.js')).default;
        const user = await userModel.findOne({Email: username});
        console.log('User found:', !! user);

        if (! user) {
            return res.status(404).json({error: 'User not found', username: username});
        }

        // Test password validation
        const validPassword = await user.isValidPassword(password);
        console.log('Password valid:', validPassword);

        if (! validPassword) {
            return res.status(401).json({error: 'Invalid password'});
        }

        // Test token generation
        const {createAccessToken, createRefreshToken} = await import ('./Helpers/generateJwt.js');
        const accessToken = await createAccessToken(user.id, user.Role);
        const refreshToken = await createRefreshToken(user.id, user.Role);

        console.log('Tokens generated successfully');

        res.json({
            success: true,
            message: 'Login test successful',
            user: {
                id: user.id,
                email: user.Email,
                role: user.Role,
                name: user.Name
            },
            tokens: {
                accessToken: !! accessToken,
                refreshToken: !! refreshToken
            }
        });

    } catch (error) {
        console.error('Test login debug error:', error);
        res.status(500).json({error: error.message, stack: error.stack, name: error.name});
    }
});

app.use("/backend", ensureDbConnected, router);

app.get('/health', async (req, res) => {
    try {
        console.log('Health check started');

        const healthStatus = {
            status: 'ok',
            timestamp: Date.now(),
            environment: 'lambda-commonjs',
            version: '1.0.0',
            nodeVersion: process.version,
            platform: process.platform
        };

        console.log('Basic health status created');

        const envCheck = {
            mongoUri: !!process.env.MONGODB_URI,
            dbName: !!process.env.dbName,
            accessTokenSecret: !!process.env.ACCESS_SECRET_KEY,
            refreshTokenSecret: !!process.env.REFRESH_SECRET_KEY,
            nodeEnv: process.env.NODE_ENV || 'not-set'
        };

        console.log('Environment check:', envCheck);

        // Optionally attempt DB connect if requested: /health?connect=1
        if (req.query.connect === '1' || req.query.connect === 'true') {
            try {
                await connectDB();
            } catch (e) {
                console.error('Health-triggered connectDB failed:', e.message);
            }
        }

        const stateMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        let readyState = mongoose.connection ?. readyState ?? 0;

        // If still connecting, wait briefly for connection to settle (up to ~2s)
        if (readyState === 2) {
            const start = Date.now();
            while (Date.now() - start < 2000 && readyState === 2) {
                await new Promise(r => setTimeout(r, 100));
                readyState = mongoose.connection ?. readyState ?? 0;
            }
        }

        // Do not attempt to connect to DB from health endpoint
        const dbStatus = {
            state: stateMap[readyState] || 'unknown'
        };

        if (readyState === 1) {
            try {
                const ping = await mongoose.connection.db.admin().ping();
                dbStatus.ping = ping ?. ok === 1 ? 'ok' : 'fail';
                dbStatus.name = mongoose.connection.name;
                dbStatus.host = mongoose.connection.host;
            } catch (e) {
                dbStatus.ping = 'fail';
                dbStatus.error = e.message;
            }
        } else {
            dbStatus.ping = 'skipped';
        } healthStatus.db = dbStatus;
        healthStatus.env = envCheck;

        // Redis health
        const redisStatus = {
            state: 'unknown'
        };
        try {
            const redisClient = await ensureRedisConnection();
            redisStatus.state = redisClient ?. status || 'unknown';

            if (redisClient && typeof redisClient.ping === 'function') {
                const pong = await redisClient.ping();
                redisStatus.ping = pong === 'PONG' ? 'ok' : 'fail';
            }
        } catch (e) {
            redisStatus.state = 'error';
            redisStatus.ping = 'fail';
            redisStatus.error = e.message;
        }
        healthStatus.redis = redisStatus;

        console.log('Sending health response');
        res.status(200).json(healthStatus);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            timestamp: Date.now(),
            environment: 'lambda-commonjs',
            error: error.message,
            type: error.name,
            stack: error.stack
        });
    }
});


// 404 handler
app.use(async (req, res, next) => {
    next(createError.NotFound());
});

// error handler
app.use((err, req, res, next) => {
    console.log("server error message", err.message)
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message
        }
    });
});

if (process.env.IS_OFFLINE || process.env.SERVERLESS_OFFLINE || !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
export const handler = serverless(app);
