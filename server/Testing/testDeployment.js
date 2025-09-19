import fetch from 'node-fetch';

const baseUrl = 'https://7twv3rxq8c.execute-api.ap-south-1.amazonaws.com';

const testEndpoints = async () => {
  console.log('Testing Lambda deployment...\n');

  // Test 1: Root endpoint
  try {
    console.log('1. Testing root endpoint...');
    const response = await fetch(`${baseUrl}/`);
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text}\n`);
  } catch (error) {
    console.log(`Error: ${error.message}\n`);
  }

  // Test 2: Health endpoint
  try {
    console.log('2. Testing health endpoint...');
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2), '\n');
  } catch (error) {
    console.log(`Error: ${error.message}\n`);
  }

  // Test 3: Login endpoint
  try {
    console.log('3. Testing login endpoint...');
    const response = await fetch(`${baseUrl}/backend/userLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'jeffrey3@xyma.in',
        password: 'Jeffrey@27'
      })
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2), '\n');
  } catch (error) {
    console.log(`Error: ${error.message}\n`);
  }
};

testEndpoints();