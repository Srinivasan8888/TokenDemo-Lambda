#!/usr/bin/env node

// Simple API test script
import fetch from 'node-fetch';

const API_BASE = 'https://7twv3rxq8c.execute-api.ap-south-1.amazonaws.com';

async function testAPI() {
  console.log('=== API TEST SCRIPT ===');
  
  try {
    // Test 1: Basic health check
    console.log('\n1. Testing basic endpoint...');
    const healthResponse = await fetch(`${API_BASE}/`);
    const healthText = await healthResponse.text();
    console.log('Health response:', healthText);
    
    // Test 2: Test login debug endpoint
    console.log('\n2. Testing login debug endpoint...');
    const debugResponse = await fetch(`${API_BASE}/test-login-debug`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test@example.com', // Replace with actual test credentials
        password: 'testpassword'
      })
    });
    
    const debugResult = await debugResponse.json();
    console.log('Debug response status:', debugResponse.status);
    console.log('Debug response:', JSON.stringify(debugResult, null, 2));
    
    // Test 3: Test actual login endpoint
    console.log('\n3. Testing actual login endpoint...');
    const loginResponse = await fetch(`${API_BASE}/backend/userLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test@example.com', // Replace with actual test credentials
        password: 'testpassword'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', JSON.stringify(loginResult, null, 2));
    
  } catch (error) {
    console.error('❌ API test error:', error.message);
  }
}

// Run the test
testAPI().catch(console.error);