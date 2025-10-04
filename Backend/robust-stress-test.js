const axios = require('axios');
const io = require('socket.io-client');

console.log('🚀 ROBUST STRESS TEST - BACKEND CAPACITY VERIFICATION');
console.log('=' .repeat(60));

// Test configuration
const CONFIG = {
  concurrentUsers: 5, // Start with fewer users
  apiCallsPerUser: 10, // Start with fewer calls
  socketMessagesPerUser: 5,
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
  errors: [],
  authErrors: []
};

// Generate test users
const generateTestUsers = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    email: `loadtest${i + 1}@test.com`,
    password: 'password123',
    name: `Test User ${i + 1}`
  }));
};

// Authenticate user with detailed logging
async function authenticateUser(userData, userIndex) {
  const userId = `user-${userIndex + 1}`;
  
  try {
    console.log(`🔐 [${userId}] Attempting authentication for ${userData.email}...`);
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: userData.email,
      password: userData.password
    }, { 
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ [${userId}] Authentication successful!`);
    console.log(`   User ID: ${response.data.user._id}`);
    
    return response.data.user._id || response.data.token;
    
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`❌ [${userId}] Authentication failed:`, errorMsg);
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Response:`, error.response?.data);
    
    results.authErrors.push({
      userId,
      email: userData.email,
      error: errorMsg,
      status: error.response?.status
    });
    
    return null;
  }
}

// Make API request with detailed logging
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
    
    console.log(`✅ [${userId}] API call successful: ${endpoint} (${responseTime}ms)`);
    
    return { success: true, responseTime, status: response.status };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    results.failedApiCalls++;
    const errorMsg = `${endpoint}: ${error.response?.data?.message || error.message}`;
    results.errors.push(errorMsg);
    
    console.error(`❌ [${userId}] API call failed: ${endpoint} - ${errorMsg}`);
    
    return { success: false, responseTime, error: errorMsg };
  }
}

// Create socket connection with detailed logging
function createSocketConnection(userId) {
  return new Promise((resolve) => {
    console.log(`🔌 [${userId}] Attempting socket connection...`);
    
    const socket = io('http://localhost:5000', {
      timeout: 5000,
      forceNew: true
    });
    
    socket.on('connect', () => {
      results.successfulSocketConnections++;
      console.log(`✅ [${userId}] Socket connected successfully!`);
      resolve({ socket, success: true });
    });
    
    socket.on('connect_error', (error) => {
      results.failedSocketConnections++;
      console.error(`❌ [${userId}] Socket connection failed:`, error.message);
      resolve({ socket: null, success: false, error: error.message });
    });
    
    setTimeout(() => {
      if (!socket.connected) {
        results.failedSocketConnections++;
        console.error(`❌ [${userId}] Socket connection timeout`);
        resolve({ socket: null, success: false, error: 'Timeout' });
      }
    }, 5000);
  });
}

// Simulate user activity with detailed logging
async function simulateUser(userData, userIndex) {
  const userId = `user-${userIndex + 1}`;
  console.log(`\n👤 [${userId}] Starting user simulation for ${userData.email}...`);
  
  // Authenticate
  const token = await authenticateUser(userData, userIndex);
  if (!token) {
    console.error(`❌ [${userId}] Cannot proceed without authentication`);
    return { userId, success: false, error: 'Authentication failed' };
  }
  
  results.authenticatedUsers++;
  console.log(`✅ [${userId}] User authenticated, proceeding with tests...`);
  
  // Make API calls
  const apiEndpoints = [
    '/health',
    '/posts',
    '/api/chat/users',
    '/posts/category/technology'
  ];
  
  console.log(`📡 [${userId}] Starting ${CONFIG.apiCallsPerUser} API calls...`);
  
  const apiPromises = [];
  for (let i = 0; i < CONFIG.apiCallsPerUser; i++) {
    const endpoint = apiEndpoints[i % apiEndpoints.length];
    const delay = i * 200; // 200ms between calls
    
    const promise = new Promise(resolve => {
      setTimeout(async () => {
        const result = await makeApiRequest(userId, token, endpoint);
        resolve(result);
      }, delay);
    });
    
    apiPromises.push(promise);
  }
  
  // Create socket connection
  console.log(`🔌 [${userId}] Creating socket connection...`);
  const socketResult = await createSocketConnection(userId);
  const { socket } = socketResult;
  
  if (socket && socket.connected) {
    console.log(`💬 [${userId}] Sending ${CONFIG.socketMessagesPerUser} socket messages...`);
    
    // Send messages
    for (let i = 0; i < CONFIG.socketMessagesPerUser; i++) {
      setTimeout(() => {
        socket.emit('send_message', {
          sender: userId,
          receiver: 'test-receiver',
          content: `Test message ${i + 1} from ${userId}`
        });
      }, i * 300); // 300ms between messages
    }
  }
  
  // Wait for API calls to complete
  console.log(`⏳ [${userId}] Waiting for API calls to complete...`);
  await Promise.all(apiPromises);
  
  console.log(`✅ [${userId}] User simulation completed successfully!`);
  return { userId, success: true };
}

// Run stress test
async function runStressTest() {
  console.log(`📊 Starting robust stress test with ${CONFIG.concurrentUsers} users...`);
  console.log(`   - API calls per user: ${CONFIG.apiCallsPerUser}`);
  console.log(`   - Socket messages per user: ${CONFIG.socketMessagesPerUser}`);
  console.log(`   - Test duration: ${CONFIG.testDuration}s`);
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  const testUsers = generateTestUsers(CONFIG.concurrentUsers);
  
  // Start all users concurrently
  const userPromises = testUsers.map((user, index) => simulateUser(user, index));
  
  // Wait for all users to complete
  const userResults = await Promise.all(userPromises);
  
  const totalTime = (Date.now() - startTime) / 1000;
  
  // Calculate metrics
  const totalApiCalls = results.successfulApiCalls + results.failedApiCalls;
  const apiSuccessRate = totalApiCalls > 0 ? (results.successfulApiCalls / totalApiCalls * 100).toFixed(2) : 0;
  const avgResponseTime = results.responseTimes.length > 0 ? 
    (results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length).toFixed(2) : 0;
  const throughput = totalApiCalls > 0 ? (totalApiCalls / totalTime).toFixed(2) : 0;
  
  // Generate detailed report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 ROBUST STRESS TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`👥 Authenticated Users: ${results.authenticatedUsers}/${CONFIG.concurrentUsers}`);
  console.log(`📡 API Calls: ${results.successfulApiCalls}/${totalApiCalls} (${apiSuccessRate}%)`);
  console.log(`🔌 Socket Connections: ${results.successfulSocketConnections}/${CONFIG.concurrentUsers}`);
  console.log(`⚡ Throughput: ${throughput} req/s`);
  console.log(`⏱️  Average Response Time: ${avgResponseTime}ms`);
  console.log(`⏱️  Total Test Time: ${totalTime.toFixed(2)}s`);
  
  if (results.authErrors.length > 0) {
    console.log(`\n❌ Authentication Errors (${results.authErrors.length}):`);
    results.authErrors.forEach(error => {
      console.log(`   - ${error.userId} (${error.email}): ${error.error} (Status: ${error.status})`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ API Errors (${results.errors.length}):`);
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
  
  console.log('\n🎉 Robust stress test completed!');
}

// Run the test
runStressTest().catch(console.error); 