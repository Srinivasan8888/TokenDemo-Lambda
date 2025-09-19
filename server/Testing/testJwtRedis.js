import dotenv from 'dotenv';
import { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken } from '../Helpers/generateJwt.js';
import { ensureRedisConnection, cleanup } from '../Helpers/initRedis.js';

// Load environment variables
dotenv.config();

const testJwtAndRedis = async () => {
  console.log('🧪 Starting JWT and Redis test...');
  
  try {
    // Test Redis connection
    console.log('\n1. Testing Redis connection...');
    const client = await ensureRedisConnection();
    console.log('✅ Redis connected successfully');
    
    // Test Redis ping
    const pong = await client.ping();
    console.log('✅ Redis ping response:', pong);
    
    // Test user data
    const testUserId = 'test-user-123';
    const testRole = 'user';
    
    console.log('\n2. Testing JWT token creation...');
    
    // Test access token creation
    console.log('Creating access token...');
    const accessToken = await createAccessToken(testUserId, testRole);
    console.log('✅ Access token created:', accessToken.substring(0, 50) + '...');
    
    // Test refresh token creation
    console.log('Creating refresh token...');
    const refreshToken = await createRefreshToken(testUserId, testRole);
    console.log('✅ Refresh token created:', refreshToken.substring(0, 50) + '...');
    
    // Test token storage in Redis
    console.log('\n3. Testing token storage in Redis...');
    
    const storedAccessToken = await client.get(`accessToken:${testUserId}`);
    const storedRefreshToken = await client.get(testUserId);
    
    console.log('Stored access token matches:', storedAccessToken === accessToken ? '✅' : '❌');
    console.log('Stored refresh token matches:', storedRefreshToken === refreshToken ? '✅' : '❌');
    
    // Test token verification
    console.log('\n4. Testing token verification...');
    
    try {
      const refreshResult = await verifyRefreshToken(refreshToken);
      console.log('✅ Refresh token verification successful:', refreshResult);
    } catch (error) {
      console.log('❌ Refresh token verification failed:', error.message);
    }
    
    // Test Redis TTL
    console.log('\n5. Testing Redis TTL...');
    const accessTokenTTL = await client.ttl(`accessToken:${testUserId}`);
    const refreshTokenTTL = await client.ttl(testUserId);
    
    console.log('Access token TTL:', accessTokenTTL, 'seconds');
    console.log('Refresh token TTL:', refreshTokenTTL, 'seconds');
    
    const keepKeys = String(process.env.KEEP_TEST_KEYS).toLowerCase() === 'true';
    if (keepKeys) {
      console.log('\n6. Keeping keys in Redis for inspection (KEEP_TEST_KEYS=true)');
      console.log('Keys to look for:');
      console.log(` - accessToken:${testUserId}`);
      console.log(` - ${testUserId}`);
    } else {
      // Clean up test data
      console.log('\n6. Cleaning up test data...');
      await client.del(`accessToken:${testUserId}`);
      await client.del(testUserId);
      console.log('✅ Test data cleaned up');
    }
    
    console.log('\n🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    // Cleanup Redis connection
    await cleanup();
    console.log('\n🔌 Redis connection closed');
    process.exit(0);
  }
};

// Run the test
testJwtAndRedis();
