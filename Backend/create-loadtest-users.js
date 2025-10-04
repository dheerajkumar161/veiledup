const axios = require('axios');

async function createLoadTestUsers() {
  console.log('🚀 Creating loadtest users for Artillery testing...');
  
  const baseURL = 'http://localhost:5000';
  const users = [];
  
  // Create 20 loadtest users
  for (let i = 1; i <= 20; i++) {
    const userData = {
      name: `LoadTest User ${i}`,
      email: `loadtest${i}@test.com`,
      password: 'password123',
      stressTest: true
    };
    
    try {
      const response = await axios.post(`${baseURL}/api/auth/register`, userData);
      console.log(`✅ Created user ${i}: ${userData.email}`);
      users.push({
        email: userData.email,
        password: userData.password,
        token: response.data.token
      });
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.message.includes('already exists')) {
        console.log(`⚠️  User ${i} already exists: ${userData.email}`);
        // Try to login to get token
        try {
          const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            email: userData.email,
            password: userData.password
          });
          users.push({
            email: userData.email,
            password: userData.password,
            token: loginResponse.data.token
          });
          console.log(`✅ Logged in user ${i}: ${userData.email}`);
        } catch (loginError) {
          console.log(`❌ Failed to login user ${i}: ${userData.email}`);
        }
      } else {
        console.log(`❌ Failed to create user ${i}: ${userData.email}`, error.response?.data || error.message);
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully created/verified ${users.length} users`);
  console.log(`📋 Users ready for testing:`);
  users.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.email} - Token: ${user.token ? '✅' : '❌'}`);
  });
  
  return users;
}

// Run if called directly
if (require.main === module) {
  createLoadTestUsers()
    .then(() => {
      console.log('\n🎉 Loadtest users setup complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error creating loadtest users:', error);
      process.exit(1);
    });
}

module.exports = { createLoadTestUsers }; 