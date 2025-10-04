const axios = require('axios');

async function testConcurrentAuth() {
  console.log('🔍 TESTING CONCURRENT AUTHENTICATION');
  console.log('=' .repeat(50));
  
  const testUsers = [
    { email: 'loadtest1@test.com', password: 'password123' },
    { email: 'loadtest2@test.com', password: 'password123' },
    { email: 'loadtest3@test.com', password: 'password123' }
  ];
  
  console.log(`📊 Testing ${testUsers.length} concurrent authentications...`);
  
  const authPromises = testUsers.map(async (user, index) => {
    try {
      console.log(`🔐 Starting auth for ${user.email}...`);
      const response = await axios.post('http://localhost:5000/api/auth/login', user, {
        timeout: 10000
      });
      console.log(`✅ Auth successful for ${user.email}`);
      return { success: true, user: user.email, data: response.data };
    } catch (error) {
      console.error(`❌ Auth failed for ${user.email}:`, error.response?.data?.message || error.message);
      return { success: false, user: user.email, error: error.response?.data?.message || error.message };
    }
  });
  
  const results = await Promise.all(authPromises);
  
  console.log('\n📊 CONCURRENT AUTH RESULTS:');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed authentications:');
    failed.forEach(f => {
      console.log(`   - ${f.user}: ${f.error}`);
    });
  }
  
  return results;
}

testConcurrentAuth().catch(console.error); 