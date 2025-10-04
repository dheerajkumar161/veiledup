const axios = require('axios');
const io = require('socket.io-client');

console.log('🚀 SIMPLE STRESS TEST - BACKEND CAPACITY VERIFICATION');
console.log('=' .repeat(60));

// Test configuration
const CONFIG = {
  concurrentUsers: 10,
  apiCallsPerUser: 50,
  socketMessagesPerUser: 20,
  testDuration: 30
};

// Test results
const results = {
  authenticatedUsers: 0,
  successfulApiCalls: 0,
  failedApiCalls: 0,
  successfulSocketConnections: 0,
  failedSocketConnections: 0,
  responseTimes: [],
  errors: []
};

// Generate test users (using our pre-populated users)
const generateTestUsers = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    email: `loadtest${i + 1}@test.com`,
    password: 'password123',
    name: `Test User ${i + 1}`
  }));
};

// Authenticate user
async function authenticateUser(userData) {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: userData.email,
      password: userData.password
    }, { timeout: 5000 });
    
    return response.data.token || response.data._id;
  } catch (error) {
    console.error(`❌ Auth failed for ${userData.email}:`, error.response?.data?.message || error.message);
    return null;
  }
}

// Make API request
async function makeApiRequest(userId, token, endpoint) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`http://localhost:5000${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 5000
    });
    
    const responseTime = Date.now() - startTime;
    results.responseTimes.push(responseTime);
    results.successfulApiCalls++;
    
    return { success: true, responseTime, status: response.status };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    results.failedApiCalls++;
    results.errors.push(`${endpoint}: ${error.message}`);
    
    return { success: false, responseTime, error: error.message };
  }
}

// Create socket connection
function createSocketConnection(userId) {
  return new Promise((resolve) => {
    const socket = io('http://localhost:5000', {
      timeout: 5000,
      forceNew: true
    });
    
    socket.on('connect', () => {
      results.successfulSocketConnections++;
      console.log(`✅ Socket connected for ${userId}`);
      resolve({ socket, success: true });
    });
    
    socket.on('connect_error', (error) => {
      results.failedSocketConnections++;
      console.error(`❌ Socket failed for ${userId}:`, error.message);
      resolve({ socket: null, success: false, error: error.message });
    });
    
    setTimeout(() => {
      if (!socket.connected) {
        results.failedSocketConnections++;
        resolve({ socket: null, success: false, error: 'Timeout' });
      }
    }, 5000);
  });
}

// Simulate user activity
async function simulateUser(userData, userIndex) {
  const userId = `user-${userIndex + 1}`;
  console.log(`👤 Starting ${userId} (${userData.email})...`);
  
  // Authenticate
  const token = await authenticateUser(userData);
  if (!token) {
    console.error(`❌ Failed to authenticate ${userId}`);
    return;
  }
  
  results.authenticatedUsers++;
  console.log(`✅ ${userId} authenticated successfully`);
  
  // Make API calls
  const apiEndpoints = [
    '/health',
    '/posts',
    '/api/chat/users',
    '/posts/category/technology'
  ];
  
  const apiPromises = [];
  for (let i = 0; i < CONFIG.apiCallsPerUser; i++) {
    const endpoint = apiEndpoints[i % apiEndpoints.length];
    const delay = i * 100; // 100ms between calls
    
    const promise = new Promise(resolve => {
      setTimeout(async () => {
        const result = await makeApiRequest(userId, token, endpoint);
        resolve(result);
      }, delay);
    });
    
    apiPromises.push(promise);
  }
  
  // Create socket connection
  const socketResult = await createSocketConnection(userId);
  const { socket } = socketResult;
  
  if (socket && socket.connected) {
    // Send messages
    for (let i = 0; i < CONFIG.socketMessagesPerUser; i++) {
      setTimeout(() => {
        socket.emit('send_message', {
          sender: userId,
          receiver: 'test-receiver',
          content: `Test message ${i + 1} from ${userId}`
        });
      }, i * 200); // 200ms between messages
    }
  }
  
  // Wait for API calls to complete
  await Promise.all(apiPromises);
  
  console.log(`✅ ${userId} completed all tests`);
}

// Run stress test
async function runStressTest() {
  console.log(`📊 Starting stress test with ${CONFIG.concurrentUsers} users...`);
  console.log(`   - API calls per user: ${CONFIG.apiCallsPerUser}`);
  console.log(`   - Socket messages per user: ${CONFIG.socketMessagesPerUser}`);
  console.log(`   - Test duration: ${CONFIG.testDuration}s`);
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  const testUsers = generateTestUsers(CONFIG.concurrentUsers);
  
  // Start all users concurrently
  const userPromises = testUsers.map((user, index) => simulateUser(user, index));
  
  // Wait for all users to complete
  await Promise.all(userPromises);
  
  const totalTime = (Date.now() - startTime) / 1000;
  
  // Calculate metrics
  const totalApiCalls = results.successfulApiCalls + results.failedApiCalls;
  const apiSuccessRate = totalApiCalls > 0 ? (results.successfulApiCalls / totalApiCalls * 100).toFixed(2) : 0;
  const avgResponseTime = results.responseTimes.length > 0 ? 
    (results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length).toFixed(2) : 0;
  const throughput = totalApiCalls > 0 ? (totalApiCalls / totalTime).toFixed(2) : 0;
  
  // Generate report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 STRESS TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`👥 Authenticated Users: ${results.authenticatedUsers}/${CONFIG.concurrentUsers}`);
  console.log(`📡 API Calls: ${results.successfulApiCalls}/${totalApiCalls} (${apiSuccessRate}%)`);
  console.log(`🔌 Socket Connections: ${results.successfulSocketConnections}/${CONFIG.concurrentUsers}`);
  console.log(`⚡ Throughput: ${throughput} req/s`);
  console.log(`⏱️  Average Response Time: ${avgResponseTime}ms`);
  console.log(`⏱️  Total Test Time: ${totalTime.toFixed(2)}s`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`);
    results.errors.slice(0, 5).forEach(error => console.log(`   - ${error}`));
    if (results.errors.length > 5) {
      console.log(`   ... and ${results.errors.length - 5} more errors`);
    }
  }
  
  // Performance assessment
  console.log('\n🎯 PERFORMANCE ASSESSMENT:');
  if (results.authenticatedUsers >= CONFIG.concurrentUsers * 0.9) {
    console.log('✅ EXCELLENT: High user authentication success');
  } else if (results.authenticatedUsers >= CONFIG.concurrentUsers * 0.7) {
    console.log('⚠️  GOOD: Moderate user authentication success');
  } else {
    console.log('❌ POOR: Low user authentication success');
  }
  
  if (apiSuccessRate >= 95) {
    console.log('✅ EXCELLENT: High API success rate');
  } else if (apiSuccessRate >= 80) {
    console.log('⚠️  GOOD: Moderate API success rate');
  } else {
    console.log('❌ POOR: Low API success rate');
  }
  
  if (avgResponseTime < 200) {
    console.log('✅ EXCELLENT: Fast response times');
  } else if (avgResponseTime < 500) {
    console.log('⚠️  GOOD: Moderate response times');
  } else {
    console.log('❌ POOR: Slow response times');
  }
  
  console.log('\n🏆 FINAL VERDICT:');
  console.log(`   Your backend can handle:`);
  console.log(`   - ${results.authenticatedUsers} concurrent authenticated users`);
  console.log(`   - ${throughput} API requests per second`);
  console.log(`   - ${results.successfulSocketConnections} real-time socket connections`);
  console.log(`   - ${apiSuccessRate}% API success rate`);
  
  console.log('\n🎉 Stress test completed!');
}

// Run the test
runStressTest().catch(console.error); 