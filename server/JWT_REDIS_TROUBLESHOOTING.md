# JWT Token and Redis Storage Troubleshooting Guide

## Issues Fixed

### 1. Redis Connection Issues in AWS Lambda
- **Problem**: Redis client was created at module import time, causing connection issues in Lambda's cold start environment
- **Solution**: Implemented lazy connection pattern with `ensureRedisConnection()` function
- **Changes**: Modified `Helpers/initRedis.js` to use connection pooling and proper error handling

### 2. JWT Token Generation Failures
- **Problem**: Missing error handling and environment variable validation
- **Solution**: Added comprehensive error handling and validation for JWT secret keys
- **Changes**: Updated `Helpers/generateJwt.js` with better error messages and logging

### 3. Redis Storage Issues
- **Problem**: Tokens weren't being stored properly in Redis
- **Solution**: Fixed Redis SET command syntax and added connection verification
- **Changes**: Updated token storage to use proper Redis command format

## Key Changes Made

### `Helpers/initRedis.js`
- Implemented lazy connection pattern
- Added AWS Lambda-specific configurations
- Added proper error handling and logging
- Added connection state management

### `Helpers/generateJwt.js`
- Added environment variable validation
- Improved error handling and logging
- Fixed Redis storage commands
- Added connection verification before Redis operations

### `server.js`
- Updated Redis health check to use new connection pattern
- Added proper error handling for Redis operations

## Testing

### 1. Environment Variables Check
```bash
node Testing/checkEnv.js
```

### 2. JWT and Redis Integration Test
```bash
node Testing/testJwtRedis.js
```

## AWS Lambda Configuration

### Required Environment Variables
```bash
# MongoDB
MONGODB_URI=your_mongodb_connection_string
dbName=your_database_name

# JWT Secrets
ACCESS_SECRET_KEY=your_access_token_secret
REFRESH_SECRET_KEY=your_refresh_token_secret

# Redis Configuration
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_USERNAME=your_redis_username
REDIS_PASSWORD=your_redis_password

# Optional
API_SECRET_KEY=your_api_key
NODE_ENV=production
```

### AWS Lambda Specific Considerations

1. **VPC Configuration**: If Redis is in a private subnet, ensure Lambda is in the same VPC
2. **Security Groups**: Allow outbound connections on Redis port (6379)
3. **Timeout Settings**: Increase Lambda timeout for Redis operations
4. **Memory**: Allocate sufficient memory for Redis client and JWT operations

### Redis Connection Troubleshooting

1. **Check Redis Accessibility**:
   ```bash
   # Test Redis connection from Lambda environment
   redis-cli -h your_redis_host -p 6379 -a your_password ping
   ```

2. **Verify Environment Variables**:
   - Run `node Testing/checkEnv.js` to verify all required variables are set
   - Check AWS Lambda environment variables in the console

3. **Check CloudWatch Logs**:
   - Look for Redis connection errors
   - Check JWT token creation logs
   - Monitor Redis operation success/failure

### Common Issues and Solutions

#### Issue: "Redis Client Error" in logs
**Solution**: 
- Verify Redis credentials and host
- Check VPC and security group configuration
- Ensure Redis instance is running and accessible

#### Issue: "JWT secret key not configured"
**Solution**:
- Set `ACCESS_SECRET_KEY` and `REFRESH_SECRET_KEY` environment variables
- Use strong, unique secrets for production

#### Issue: "Failed to create access token"
**Solution**:
- Check JWT secret keys are properly set
- Verify Redis connection is working
- Check CloudWatch logs for specific error details

#### Issue: Tokens not appearing in Redis
**Solution**:
- Verify Redis connection is established before token storage
- Check Redis TTL settings
- Verify Redis key naming convention

## Monitoring and Debugging

### CloudWatch Logs to Monitor
- Redis connection status
- JWT token creation success/failure
- Redis storage operations
- Error messages and stack traces

### Health Check Endpoint
Use `/health` endpoint to check:
- Redis connection status
- Environment variable configuration
- Database connection status

### Testing Commands
```bash
# Test environment setup
node Testing/checkEnv.js

# Test JWT and Redis integration
node Testing/testJwtRedis.js

# Test health endpoint
curl https://your-lambda-url/health
```

## Production Recommendations

1. **Use AWS ElastiCache**: For better Lambda integration
2. **Implement Connection Pooling**: For better performance
3. **Add Monitoring**: Use CloudWatch metrics for Redis and JWT operations
4. **Security**: Use AWS Secrets Manager for sensitive environment variables
5. **Error Handling**: Implement proper retry logic for Redis operations

## Support

If you continue to experience issues:
1. Check CloudWatch logs for specific error messages
2. Verify all environment variables are correctly set
3. Test Redis connectivity from your local environment
4. Ensure AWS Lambda has proper VPC and security group configuration
