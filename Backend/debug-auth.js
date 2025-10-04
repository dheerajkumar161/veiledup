const axios = require('axios');

async function debugAuth() {
  console.log('🔍 DEBUGGING AUTHENTICATION ISSUES');
  console.log('=' .repeat(50));
  
  const testUser = {
    email: 'loadtest1@test.com',
    password: 'password123'
  };
  
  console.log(`📧 Testing with: ${testUser.email}`);
  console.log(`🔑 Password: ${testUser.password}`);
  console.log('=' .repeat(50));
  
  try {
    console.log('🔗 Making login request...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', testUser, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Login failed!');
    console.error('📊 Error details:');
    console.error('   Status:', error.response?.status);
    console.error('   Status Text:', error.response?.statusText);
    console.error('   Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('   Error Message:', error.message);
    console.error('   Error Code:', error.code);
    
    if (error.response?.data) {
      console.error('\n🔍 Full error response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugAuth().catch(console.error); 