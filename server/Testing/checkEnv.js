import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Check');
console.log('================================');

const requiredEnvVars = [
  'MONGODB_URI',
  'dbName',
  'ACCESS_SECRET_KEY',
  'REFRESH_SECRET_KEY',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_USERNAME',
  'REDIS_PASSWORD'
];

const optionalEnvVars = [
  'API_SECRET_KEY',
  'NODE_ENV',
  'PORT'
];

console.log('\n📋 Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? (varName.includes('SECRET') || varName.includes('PASSWORD') ? '***' : value) : 'NOT SET';
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  const displayValue = value || 'NOT SET';
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n🔧 Redis Configuration:');
console.log(`Host: ${process.env.REDIS_HOST || 'NOT SET'}`);
console.log(`Port: ${process.env.REDIS_PORT || 'NOT SET'}`);
console.log(`Username: ${process.env.REDIS_USERNAME ? 'SET' : 'NOT SET'}`);
console.log(`Password: ${process.env.REDIS_PASSWORD ? 'SET' : 'NOT SET'}`);

console.log('\n🔧 JWT Configuration:');
console.log(`Access Secret: ${process.env.ACCESS_SECRET_KEY ? 'SET' : 'NOT SET'}`);
console.log(`Refresh Secret: ${process.env.REFRESH_SECRET_KEY ? 'SET' : 'NOT SET'}`);

console.log('\n🔧 MongoDB Configuration:');
console.log(`URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);
console.log(`Database: ${process.env.dbName || 'NOT SET'}`);

// Check for missing required variables
const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingRequired.length > 0) {
  console.log('\n❌ Missing required environment variables:');
  missingRequired.forEach(varName => console.log(`  - ${varName}`));
  console.log('\n💡 Please set these environment variables before running the application.');
} else {
  console.log('\n✅ All required environment variables are set!');
}

console.log('\n📝 AWS Lambda Specific Notes:');
console.log('- Make sure your Redis instance is accessible from AWS Lambda');
console.log('- Check VPC configuration if Redis is in a private subnet');
console.log('- Verify security groups allow outbound connections on Redis port');
console.log('- Consider using AWS ElastiCache for better Lambda integration');
