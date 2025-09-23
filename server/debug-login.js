#!/usr/bin/env node

// Debug script to test login functionality locally
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import userModel from './Models/UserModel.js';
import { createAccessToken, createRefreshToken } from './Helpers/generateJwt.js';

// Load environment variables
dotenv.config();

async function debugLogin() {
  console.log('=== LOGIN DEBUG SCRIPT ===');
  
  // Check environment variables
  console.log('\n1. Environment Variables:');
  console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Present' : 'MISSING');
  console.log('- dbName:', process.env.dbName || 'MISSING');
  console.log('- ACCESS_SECRET_KEY:', process.env.ACCESS_SECRET_KEY ? 'Present' : 'MISSING');
  console.log('- REFRESH_SECRET_KEY:', process.env.REFRESH_SECRET_KEY ? 'Present' : 'MISSING');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing!');
    process.exit(1);
  }
  
  try {
    // Test database connection
    console.log('\n2. Testing Database Connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.dbName,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Database connected successfully');
    
    // Test user lookup
    console.log('\n3. Testing User Lookup...');
    const users = await userModel.find().limit(5);
    console.log(`Found ${users.length} users in database`);
    
    if (users.length > 0) {
      const testUser = users[0];
      console.log('Test user:', {
        id: testUser._id,
        email: testUser.Email,
        role: testUser.Role,
        name: testUser.Name
      });
      
      // Test token generation
      console.log('\n4. Testing Token Generation...');
      const accessToken = await createAccessToken(testUser._id.toString(), testUser.Role);
      const refreshToken = await createRefreshToken(testUser._id.toString(), testUser.Role);
      
      console.log('✅ Access token generated:', accessToken ? 'Success' : 'Failed');
      console.log('✅ Refresh token generated:', refreshToken ? 'Success' : 'Failed');
      
      console.log('\n5. Testing Password Validation...');
      // Note: You'll need to know a test password to validate
      console.log('Password validation test skipped (need actual password)');
      
    } else {
      console.log('❌ No users found in database');
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the debug script
debugLogin().catch(console.error);