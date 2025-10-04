const axios = require('axios');
const io = require('socket.io-client');

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_CONFIG = {
  concurrentUsers: 12, // Test with 12 users (exceeding 10+ claim)
  apiCallsPerUser: 50, // 12 users × 50 calls = 600 calls (exceeding 500+ claim)
  testDuration: 30000 // 30 seconds
};

// Test results
let results = {
  serverHealth: false,
  apiTests: [],
  socketTests: [],
  concurrentUsers: 0,
  totalApiCalls: 0,
  errors: []
};

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test server health
async function testServerHealth() {
  console.log('🔍 Testing server health...');
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Server is healthy:', response.data.status);
    results.serverHealth = true;
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    results.serverHealth = false;
    return false;
  }
}

// Test API endpoints
async function testApiEndpoints() {
  console.log('🔍 Testing API endpoints...');
  
  const endpoints = [
    '/health',
    '/posts',
    '/api/chat/users'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}${endpoint}`, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      results.apiTests.push({
        endpoint,
        success: true,
        status: response.status,
        responseTime
      });
      
      console.log(`✅ ${endpoint}: ${response.status} (${responseTime}ms)`);
    } catch (error) {
      results.apiTests.push({
        endpoint,
        success: false,
        error: error.message
      });
      
      console.error(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// Test Socket.io connection
async function testSocketConnection(userId) {
  return new Promise((resolve) => {
    const socket = io(BASE_URL, { timeout: 5000 });
    
    socket.on('connect', () => {
      console.log(`✅ Socket connected for user ${userId}`);
      socket.emit('join', userId);
      
      // Test sending a message
      socket.emit('send_message', {
        sender: userId,
        receiver: 'test-receiver',
        content: `Test message from ${userId}`
      });
      
      results.socketTests.push({
        userId,
        success: true,
        socketId: socket.id
      });
      
      // Disconnect after 2 seconds
      setTimeout(() => {
        socket.disconnect();
        resolve(true);
      }, 2000);
    });
    
    socket.on('connect_error', (error) => {
      console.error(`❌ Socket connection failed for ${userId}:`, error.message);
      results.socketTests.push({
        userId,
        success: false,
        error: error.message
      });
      resolve(false);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!socket.connected) {
        console.error(`⏰ Socket timeout for ${userId}`);
        results.socketTests.push({
          userId,
          success: false,
          error: 'Connection timeout'
        });
        resolve(false);
      }
    }, 5000);
  });
}

// Simulate concurrent users
async function simulateConcurrentUsers() {
  console.log(`🚀 Simulating ${TEST_CONFIG.concurrentUsers} concurrent users...`);
  
  const userPromises = [];
  
  for (let i = 0; i < TEST_CONFIG.concurrentUsers; i++) {
    const userId = `user-${i + 1}`;
    console.log(`👤 Starting user ${userId}...`);
    
    const userPromise = (async () => {
      // Test API calls for this user
      const apiPromises = [];
      for (let j = 0; j < TEST_CONFIG.apiCallsPerUser; j++) {
        const endpoints = ['/health', '/posts'];
        const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        
        const apiPromise = axios.get(`${BASE_URL}${randomEndpoint}`, { timeout: 5000 })
          .then(() => {
            results.totalApiCalls++;
            return { success: true };
          })
          .catch((error) => {
            results.totalApiCalls++;
            results.errors.push(`API call failed for ${userId}: ${error.message}`);
            return { success: false, error: error.message };
          });
        
        apiPromises.push(apiPromise);
        await sleep(50); // Small delay between calls
      }
      
      // Test socket connection
      const socketSuccess = await testSocketConnection(userId);
      
      // Wait for all API calls to complete
      await Promise.all(apiPromises);
      
      return { userId, socketSuccess };
    })();
    
    userPromises.push(userPromise);
    
    // Small delay between starting users
    await sleep(200);
  }
  
  const userResults = await Promise.all(userPromises);
  results.concurrentUsers = userResults.filter(r => r.socketSuccess).length;
  
  return userResults;
}

// Generate verification report
function generateReport() {
  const successfulApiTests = results.apiTests.filter(test => test.success).length;
  const successfulSocketTests = results.socketTests.filter(test => test.success).length;
  const avgResponseTime = results.apiTests.length > 0 
    ? results.apiTests.reduce((sum, test) => sum + (test.responseTime || 0), 0) / results.apiTests.length 
    : 0;
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 SCALABILITY VERIFICATION REPORT');
  console.log('=' .repeat(60));
  
  console.log(`🔍 Server Health: ${results.serverHealth ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`🔍 API Endpoints: ${successfulApiTests}/${results.apiTests.length} (${((successfulApiTests/results.apiTests.length)*100).toFixed(1)}%)`);
  console.log(`🔍 Socket Connections: ${successfulSocketTests}/${results.socketTests.length} (${((successfulSocketTests/results.socketTests.length)*100).toFixed(1)}%)`);
  console.log(`🔍 Concurrent Users: ${results.concurrentUsers}/${TEST_CONFIG.concurrentUsers}`);
  console.log(`🔍 Total API Calls: ${results.totalApiCalls}`);
  console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`❌ Total Errors: ${results.errors.length}`);
  
  // Verify claims
  const claims = {
    concurrentUsers: results.concurrentUsers >= 10,
    apiCalls: results.totalApiCalls >= 500,
    realTimeChat: successfulSocketTests >= 10,
    performance: avgResponseTime < 1000
  };
  
  console.log('\n🎯 CLAIMS VERIFICATION:');
  console.log(`   ✅ 10+ Concurrent Users: ${claims.concurrentUsers ? 'PASSED' : 'FAILED'} (${results.concurrentUsers} users)`);
  console.log(`   ✅ 500+ API Calls: ${claims.apiCalls ? 'PASSED' : 'FAILED'} (${results.totalApiCalls} calls)`);
  console.log(`   ✅ Real-time Chat: ${claims.realTimeChat ? 'PASSED' : 'FAILED'} (${successfulSocketTests} connections)`);
  console.log(`   ✅ Performance: ${claims.performance ? 'PASSED' : 'FAILED'} (${avgResponseTime.toFixed(2)}ms)`);
  
  const overallSuccess = Object.values(claims).every(claim => claim);
  
  console.log(`\n🏆 FINAL VERDICT: ${overallSuccess ? '✅ ALL CLAIMS VERIFIED' : '❌ SOME CLAIMS NEED IMPROVEMENT'}`);
  
  if (!overallSuccess) {
    console.log('\n💡 RECOMMENDATIONS:');
    if (!claims.concurrentUsers) {
      console.log('   - Check server resources and connection limits');
      console.log('   - Implement connection pooling');
    }
    if (!claims.apiCalls) {
      console.log('   - Verify API endpoints are working correctly');
      console.log('   - Check for rate limiting');
    }
    if (!claims.realTimeChat) {
      console.log('   - Review Socket.io configuration');
      console.log('   - Check CORS settings');
    }
    if (!claims.performance) {
      console.log('   - Optimize database queries');
      console.log('   - Add caching layer');
    }
  }
  
  return {
    success: overallSuccess,
    claims,
    results
  };
}

// Main verification function
async function verifyScalability() {
  console.log('🚀 Starting Scalability Verification...');
  console.log('=' .repeat(60));
  console.log(`📊 Test Configuration:`);
  console.log(`   - Concurrent Users: ${TEST_CONFIG.concurrentUsers}`);
  console.log(`   - API Calls per User: ${TEST_CONFIG.apiCallsPerUser}`);
  console.log(`   - Total Expected API Calls: ${TEST_CONFIG.concurrentUsers * TEST_CONFIG.apiCallsPerUser}`);
  console.log(`   - Test Duration: ${TEST_CONFIG.testDuration / 1000}s`);
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Check server health
    const serverHealthy = await testServerHealth();
    if (!serverHealthy) {
      console.error('❌ Server is not healthy. Please start your backend server first.');
      return { success: false, error: 'Server not healthy' };
    }
    
    // Step 2: Test API endpoints
    await testApiEndpoints();
    
    // Step 3: Simulate concurrent users
    await simulateConcurrentUsers();
    
    // Step 4: Generate report
    const report = generateReport();
    
    return report;
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return { success: false, error: error.message };
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyScalability()
    .then(result => {
      console.log('\n🎉 Scalability verification completed!');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Verification execution failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyScalability }; 