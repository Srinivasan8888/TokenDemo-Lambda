import Redis from 'ioredis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let client = null;

// Function to get or create Redis client
const getRedisClient = () => {
  if (!client) {
    try {
      console.log('Creating new Redis client...');
      const dbIndex = parseInt(process.env.REDIS_DB || process.env.REDIS_DB_NAME || '0');
      console.log('Redis config:', {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        username: process.env.REDIS_USERNAME ? '***' : 'not set',
        password: process.env.REDIS_PASSWORD ? '***' : 'not set',
        db: dbIndex
      });

      const useUrl = !!process.env.REDIS_URL;
      const useTLS = process.env.REDIS_TLS === 'true' || /redis\.io|upstash\.io|cache\.amazonaws\.com/i.test(String(process.env.REDIS_HOST || '')) || String(process.env.REDIS_PORT) === '6380';

      const baseOptions = useUrl
        ? {
            // URL form like rediss://user:pass@host:port
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            connectTimeout: 10000,
            commandTimeout: 5000,
            keepAlive: 30000,
            enableReadyCheck: false,
            db: dbIndex,
          }
        : {
            username: process.env.REDIS_USERNAME,
            password: process.env.REDIS_PASSWORD,
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            db: dbIndex,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxRetriesPerRequest: 3, // Changed from null to 3 for Lambda
            lazyConnect: true, // Important for Lambda
            connectTimeout: 10000,
            commandTimeout: 5000,
            family: 4, // Force IPv4
            keepAlive: 30000,
          };

      const tlsOptions = useTLS
        ? {
            tls: {
              rejectUnauthorized: false,
            },
          }
        : {};

      client = useUrl
        ? new Redis(process.env.REDIS_URL, { ...baseOptions, ...tlsOptions })
        : new Redis({ ...baseOptions, ...tlsOptions });

      client.on('error', err => {
        console.error('Redis Client Error:', err.message);
        // Don't throw error, just log it for Lambda
      });

      client.on("connect", () => {
        console.log("Client connected to redis...");
      });

      client.on("ready", () => {
        console.log("Client connected to redis and ready to use...");
      });

      client.on("end", () => {
        console.log("Client disconnected from redis...");
      });

      client.on("close", () => {
        console.log("Redis connection closed");
      });

    } catch (error) {
      console.error('Failed to create Redis client:', error.message);
      throw error;
    }
  }
  return client;
};

// Function to ensure Redis connection
const ensureRedisConnection = async () => {
  try {
    const redisClient = getRedisClient();
    
    if (redisClient.status !== 'ready') {
      console.log('Redis status:', redisClient.status, '- attempting connection...');
      
      // Set a timeout for connection attempt
      const connectionPromise = redisClient.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 10000)
      );
      
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log('Redis connected successfully');
    }
    
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error.message);
    // Instead of throwing, return a mock client that logs warnings
    return {
      set: async (...args) => {
        console.warn('Redis unavailable - skipping SET operation:', args[0]);
        return 'OK';
      },
      get: async (key) => {
        console.warn('Redis unavailable - skipping GET operation:', key);
        return null;
      },
      del: async (key) => {
        console.warn('Redis unavailable - skipping DEL operation:', key);
        return 1;
      },
      status: 'error'
    };
  }
};

// Lambda-compatible cleanup
const cleanup = async () => {
  if (client && client.status === 'ready') {
    try {
      await client.quit();
      console.log("Redis client disconnected ...");
    } catch (error) {
      console.error('Error disconnecting Redis:', error.message);
    }
  }
  client = null;
};

// Handle Lambda container reuse
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

export default getRedisClient;
export { ensureRedisConnection, cleanup };
