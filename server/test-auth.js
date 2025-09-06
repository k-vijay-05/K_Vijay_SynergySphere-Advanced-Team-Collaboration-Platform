// Simple test script for auth endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/auth';

async function testAuth() {
  try {
    console.log('🧪 Testing Authentication API...\n');

    // Test 1: Register a new user
    console.log('1️⃣ Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, {
      email: 'test@example.com',
      password: 'TestPass123',
      name: 'Test User'
    });
    
    console.log('✅ Registration successful');
    console.log('User:', registerResponse.data.data.user);
    
    const { accessToken, refreshToken } = registerResponse.data.data;
    console.log('🔑 Received tokens\n');

    // Test 2: Get user profile
    console.log('2️⃣ Testing protected route (get profile)...');
    const profileResponse = await axios.get(`${BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✅ Profile retrieved successfully');
    console.log('Profile:', profileResponse.data.data.user);
    console.log('');

    // Test 3: Refresh token
    console.log('3️⃣ Testing token refresh...');
    const refreshResponse = await axios.post(`${BASE_URL}/refresh`, {
      refreshToken: refreshToken
    });
    
    console.log('✅ Token refresh successful');
    const newAccessToken = refreshResponse.data.data.accessToken;
    console.log('🔑 Received new tokens\n');

    // Test 4: Login with same credentials
    console.log('4️⃣ Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: 'test@example.com',
      password: 'TestPass123'
    });
    
    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.data.user);
    console.log('');

    // Test 5: Logout
    console.log('5️⃣ Testing logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/logout`, {
      refreshToken: loginResponse.data.data.refreshToken
    });
    
    console.log('✅ Logout successful');
    console.log('Message:', logoutResponse.data.message);
    console.log('');

    console.log('🎉 All tests passed! Auth API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testAuth();
}

module.exports = testAuth;