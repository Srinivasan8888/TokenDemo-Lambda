import { connectDB } from '../Helpers/initMongodb.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('Testing MongoDB connection...');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? 'PROVIDED' : 'MISSING');
  console.log('Database name:', process.env.dbName);
  
  try {
    const connected = await connectDB();
    console.log('Connection result:', connected);
    console.log('Connection state:', mongoose.connection.readyState);
    
    if (connected) {
      console.log('✅ Database connection successful');
      console.log('Database name:', mongoose.connection.db.databaseName);
      
      // Test a simple query
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
    } else {
      console.log('❌ Database connection failed');
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

testConnection();