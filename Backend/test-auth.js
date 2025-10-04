const axios = require('axios');

async function testAuth() {
  console.log('🔍 Testing authentication with pre-populated users...');
  
  const testUsers = [
    { email: 'loadtest1@test.com', password: 'password123' },
    { email: 'loadtest2@test.com', password: 'password123' },
    { email: 'loadtest3@test.com', password: 'password123' }
  ];
  
  for (const user of testUsers) {
    try {
      console.log(`\n🔐 Testing login for ${user.email}...`);
      
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: user.email,
        password: user.password
      }, { timeout: 5000 });
      
      console.log(`✅ Login successful for ${user.email}:`, response.data.message);
      console.log(`   User ID: ${response.data.user._id}`);
      
    } catch (error) {
      console.error(`❌ Login failed for ${user.email}:`, error.response?.data || error.message);
    }
  }
  
  console.log('\n🎉 Authentication test completed!');
}

testAuth().catch(console.error); 