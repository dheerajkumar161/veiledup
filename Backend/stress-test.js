const axios = require('axios');
const io = require('socket.io-client');
const { performance } = require('perf_hooks');

// Stress Test Configuration - Pushing to maximum limits
const STRESS_CONFIG = {
  // Start with high numbers and gradually increase
  concurrentUsers: 50, // Start with 50 users
  apiCallsPerUser: 200, // 200 calls per user = 10,000 total calls
  socketMessagesPerUser: 100, // 100 messages per user
  testDuration: 120000, // 2 minutes
  rampUpTime: 10000, // 10 seconds
  maxResponseTime: 5000, // 5 seconds max response time
  targetSuccessRate: 95 // 95% success rate threshold
};

// Test results storage
const stressResults = {
  apiTests: [],
  socketTests: [],
  concurrentTests: [],
  performance: {},
  errors: [],
  limits: {
    maxConcurrentUsers: 0,
    maxApiCalls: 0,
    maxSocketConnections: 0,
    maxThroughput: 0
  }
};

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomString = (length) => Math.random().toString(36).substring(2, length + 2);

// Test user data - Generate more users for stress testing
const generateTestUsers = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    email: `loadtest${i + 1}@test.com`,
    password: 'password123',
    name: `Stress Test User ${i + 1}`,
    stressTest: true
  }));
};

// Authentication helper
async function authenticateUser(userData) {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', { 
      email: userData.email, 
      password: userData.password 
    }, { timeout: 10000 });
    return response.data.token || response.data._id;
  } catch (error) {
    console.error(`Authentication failed for ${userData.email}:`, error.message);
    return null;
  }
}

// API Load Testing with maximum intensity
async function makeApiRequest(userId, token = null, endpoint = null) {
  const startTime = performance.now();
  
  if (!endpoint) {
    const endpoints = [
      '/health',
      '/posts',
      '/api/chat/users',
      '/posts/category/technology',
      '/posts/categories?categories=technology,design',
      '/api/auth/create-test-users'
    ];
    endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  }
  
  try {
    const config = {
      method: 'GET',
      url: `http://localhost:5000${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: STRESS_CONFIG.maxResponseTime
    };
    
    const response = await axios(config);
    const responseTime = performance.now() - startTime;
    
    stressResults.apiTests.push({
      userId,
      endpoint,
      success: true,
      status: response.status,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    return { success: true, responseTime, status: response.status };
  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    stressResults.apiTests.push({
      userId,
      endpoint,
      success: false,
      status: error.response?.status || 0,
      responseTime,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return { success: false, responseTime, error: error.message };
  }
}

// Socket.io Stress Testing
async function createSocketConnection(userId) {
  return new Promise((resolve) => {
    const socket = io('http://localhost:5000', {
      timeout: 10000,
      forceNew: true,
      transports: ['websocket', 'polling']
    });
    
    const connectStartTime = performance.now();
    
    socket.on('connect', () => {
      const connectTime = performance.now() - connectStartTime;
      
      stressResults.socketTests.push({
        userId,
        success: true,
        connectTime,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Socket connected for ${userId} in ${connectTime.toFixed(2)}ms`);
      resolve({ socket, connectTime, success: true });
    });
    
    socket.on('connect_error', (error) => {
      const connectTime = performance.now() - connectStartTime;
      
      stressResults.socketTests.push({
        userId,
        success: false,
        connectTime,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.error(`❌ Socket connection failed for ${userId}:`, error.message);
      resolve({ socket: null, connectTime, success: false, error: error.message });
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!socket.connected) {
        const connectTime = performance.now() - connectStartTime;
        stressResults.socketTests.push({
          userId,
          success: false,
          connectTime,
          error: 'Connection timeout',
          timestamp: new Date().toISOString()
        });
        resolve({ socket: null, connectTime, success: false, error: 'Connection timeout' });
      }
    }, 10000);
  });
}

// Maximum Capacity User Simulation
async function simulateMaxCapacityUser(userData, userIndex) {
  const userId = `stress-user-${userIndex + 1}`;
  console.log(`👤 Starting stress user ${userId}...`);
  
  // Authenticate user
  const token = await authenticateUser(userData);
  if (!token) {
    console.error(`❌ Failed to authenticate user ${userId}`);
    return { userId, success: false, error: 'Authentication failed' };
  }
  
  // Test maximum API calls
  const apiPromises = [];
  for (let i = 0; i < STRESS_CONFIG.apiCallsPerUser; i++) {
    const delay = i * 50; // 50ms between calls
    const promise = sleep(delay).then(() => makeApiRequest(userId, token));
    apiPromises.push(promise);
  }
  
  // Test maximum socket connections and messages
  const socketResult = await createSocketConnection(userId);
  const { socket } = socketResult;
  
  if (socket && socket.connected) {
    // Send maximum messages
    for (let i = 0; i < STRESS_CONFIG.socketMessagesPerUser; i++) {
      const delay = i * 100; // 100ms between messages
      setTimeout(() => {
        const messageData = {
          sender: userId,
          receiver: 'stress-receiver',
          content: `Stress test message ${i + 1} from ${userId}`
        };
        
        socket.emit('send_message', messageData);
      }, delay);
    }
    
    // Listen for received messages
    socket.on('receive_message', (data) => {
      // Track message delivery
    });
  }
  
  // Wait for all API calls to complete
  const apiResults = await Promise.all(apiPromises);
  
  // Cleanup
  if (socket) {
    socket.disconnect();
  }
  
  const successfulApiCalls = apiResults.filter(result => result.success).length;
  const successRate = (successfulApiCalls / STRESS_CONFIG.apiCallsPerUser) * 100;
  
  console.log(`✅ Stress user ${userId} completed: ${successfulApiCalls}/${STRESS_CONFIG.apiCallsPerUser} API calls (${successRate.toFixed(1)}%)`);
  
  return {
    userId,
    success: true,
    token,
    apiResults,
    socketResult,
    successRate
  };
}

// Progressive Load Testing to Find Maximum Capacity
async function findMaximumCapacity() {
  console.log('🚀 STRESS TESTING - FINDING MAXIMUM CAPACITY');
  console.log('=' .repeat(60));
  console.log(`📊 Initial Test Configuration:`);
  console.log(`   - Concurrent Users: ${STRESS_CONFIG.concurrentUsers}`);
  console.log(`   - API Calls per User: ${STRESS_CONFIG.apiCallsPerUser}`);
  console.log(`   - Total Expected API Calls: ${STRESS_CONFIG.concurrentUsers * STRESS_CONFIG.apiCallsPerUser}`);
  console.log(`   - Socket Messages per User: ${STRESS_CONFIG.socketMessagesPerUser}`);
  console.log(`   - Test Duration: ${STRESS_CONFIG.testDuration / 1000}s`);
  console.log('=' .repeat(60));
  
  const startTime = performance.now();
  
  // Generate test users
  const testUsers = generateTestUsers(STRESS_CONFIG.concurrentUsers);
  
  // Progressive load testing
  const capacityTests = [
    { users: 10, description: 'Baseline Test' },
    { users: 25, description: 'Medium Load Test' },
    { users: 50, description: 'High Load Test' },
    { users: 75, description: 'Extreme Load Test' },
    { users: 100, description: 'Maximum Load Test' }
  ];
  
  let maxCapacity = {
    concurrentUsers: 0,
    apiCalls: 0,
    socketConnections: 0,
    throughput: 0,
    successRate: 0
  };
  
  for (const test of capacityTests) {
    console.log(`\n🔥 Running ${test.description} with ${test.users} users...`);
    
    const testStartTime = performance.now();
    const userSubset = testUsers.slice(0, test.users);
    
    // Run concurrent users
    const userPromises = userSubset.map((userData, index) => 
      simulateMaxCapacityUser(userData, index)
    );
    
    const results = await Promise.all(userPromises);
    const testEndTime = performance.now();
    
    // Calculate metrics
    const successfulUsers = results.filter(r => r.success).length;
    const totalApiCalls = stressResults.apiTests.filter(test => 
      test.timestamp && new Date(test.timestamp) >= new Date(testStartTime)
    ).length;
    
    const successfulApiCalls = stressResults.apiTests.filter(test => 
      test.success && test.timestamp && new Date(test.timestamp) >= new Date(testStartTime)
    ).length;
    
    const successfulSockets = stressResults.socketTests.filter(test => 
      test.success && test.timestamp && new Date(test.timestamp) >= new Date(testStartTime)
    ).length;
    
    const testDuration = (testEndTime - testStartTime) / 1000;
    const throughput = totalApiCalls / testDuration;
    const successRate = (successfulApiCalls / totalApiCalls) * 100;
    
    console.log(`📊 ${test.description} Results:`);
    console.log(`   - Users: ${successfulUsers}/${test.users}`);
    console.log(`   - API Calls: ${successfulApiCalls}/${totalApiCalls}`);
    console.log(`   - Socket Connections: ${successfulSockets}/${test.users}`);
    console.log(`   - Throughput: ${throughput.toFixed(2)} req/s`);
    console.log(`   - Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   - Duration: ${testDuration.toFixed(2)}s`);
    
    // Update maximum capacity if this test was successful
    if (successRate >= STRESS_CONFIG.targetSuccessRate && successfulUsers === test.users) {
      maxCapacity = {
        concurrentUsers: successfulUsers,
        apiCalls: totalApiCalls,
        socketConnections: successfulSockets,
        throughput: throughput,
        successRate: successRate
      };
      
      stressResults.limits.maxConcurrentUsers = successfulUsers;
      stressResults.limits.maxApiCalls = totalApiCalls;
      stressResults.limits.maxSocketConnections = successfulSockets;
      stressResults.limits.maxThroughput = throughput;
    } else {
      console.log(`⚠️  Test failed success rate threshold (${STRESS_CONFIG.targetSuccessRate}%)`);
      break;
    }
    
    // Wait between tests
    await sleep(5000);
  }
  
  const totalDuration = (performance.now() - startTime) / 1000;
  stressResults.performance = {
    totalDuration: `${totalDuration.toFixed(2)}s`,
    maxCapacity
  };
  
  return maxCapacity;
}

// Generate Maximum Capacity Report
function generateMaxCapacityReport(maxCapacity) {
  const totalApiTests = stressResults.apiTests.length;
  const successfulApiTests = stressResults.apiTests.filter(test => test.success).length;
  const totalSocketTests = stressResults.socketTests.length;
  const successfulSocketTests = stressResults.socketTests.filter(test => test.success).length;
  
  const avgResponseTime = stressResults.apiTests.length > 0 
    ? stressResults.apiTests.reduce((sum, test) => sum + test.responseTime, 0) / stressResults.apiTests.length 
    : 0;
  
  const p95ResponseTime = stressResults.apiTests.length > 0
    ? stressResults.apiTests
        .filter(test => test.success)
        .sort((a, b) => a.responseTime - b.responseTime)[Math.floor(stressResults.apiTests.length * 0.95)]
        ?.responseTime || 0
    : 0;
  
  console.log('\n' + '=' .repeat(60));
  console.log('🚀 MAXIMUM CAPACITY STRESS TEST REPORT');
  console.log('=' .repeat(60));
  
  console.log(`🔥 MAXIMUM ACHIEVED CAPACITY:`);
  console.log(`   👥 Concurrent Users: ${maxCapacity.concurrentUsers}`);
  console.log(`   📡 API Calls: ${maxCapacity.apiCalls}`);
  console.log(`   🔌 Socket Connections: ${maxCapacity.socketConnections}`);
  console.log(`   ⚡ Throughput: ${maxCapacity.throughput.toFixed(2)} req/s`);
  console.log(`   ✅ Success Rate: ${maxCapacity.successRate.toFixed(1)}%`);
  
  console.log(`\n📊 OVERALL TEST METRICS:`);
  console.log(`   📈 Total API Tests: ${totalApiTests}`);
  console.log(`   ✅ Successful API Tests: ${successfulApiTests} (${((successfulApiTests/totalApiTests)*100).toFixed(1)}%)`);
  console.log(`   📈 Total Socket Tests: ${totalSocketTests}`);
  console.log(`   ✅ Successful Socket Tests: ${successfulSocketTests} (${((successfulSocketTests/totalSocketTests)*100).toFixed(1)}%)`);
  console.log(`   ⏱️  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   📊 95th Percentile Response Time: ${p95ResponseTime.toFixed(2)}ms`);
  console.log(`   ❌ Total Errors: ${stressResults.errors.length}`);
  
  // Performance Analysis
  console.log(`\n🎯 PERFORMANCE ANALYSIS:`);
  
  if (maxCapacity.concurrentUsers >= 50) {
    console.log(`   🏆 EXCELLENT: System handles 50+ concurrent users`);
  } else if (maxCapacity.concurrentUsers >= 25) {
    console.log(`   ✅ GOOD: System handles 25+ concurrent users`);
  } else if (maxCapacity.concurrentUsers >= 10) {
    console.log(`   ⚠️  ADEQUATE: System handles 10+ concurrent users`);
  } else {
    console.log(`   ❌ POOR: System struggles with concurrent users`);
  }
  
  if (maxCapacity.throughput >= 1000) {
    console.log(`   🏆 EXCELLENT: High throughput (1000+ req/s)`);
  } else if (maxCapacity.throughput >= 500) {
    console.log(`   ✅ GOOD: Moderate throughput (500+ req/s)`);
  } else if (maxCapacity.throughput >= 100) {
    console.log(`   ⚠️  ADEQUATE: Low throughput (100+ req/s)`);
  } else {
    console.log(`   ❌ POOR: Very low throughput`);
  }
  
  if (avgResponseTime < 200) {
    console.log(`   🏆 EXCELLENT: Fast response times (<200ms)`);
  } else if (avgResponseTime < 500) {
    console.log(`   ✅ GOOD: Reasonable response times (<500ms)`);
  } else if (avgResponseTime < 1000) {
    console.log(`   ⚠️  ADEQUATE: Slow response times (<1s)`);
  } else {
    console.log(`   ❌ POOR: Very slow response times (>1s)`);
  }
  
  // Recommendations
  console.log(`\n💡 OPTIMIZATION RECOMMENDATIONS:`);
  
  if (maxCapacity.concurrentUsers < 50) {
    console.log(`   - Implement connection pooling for database`);
    console.log(`   - Add load balancing`);
    console.log(`   - Consider horizontal scaling`);
  }
  
  if (maxCapacity.throughput < 500) {
    console.log(`   - Add Redis caching layer`);
    console.log(`   - Optimize database queries`);
    console.log(`   - Implement database indexing`);
  }
  
  if (avgResponseTime > 500) {
    console.log(`   - Optimize API endpoints`);
    console.log(`   - Add response compression`);
    console.log(`   - Consider CDN for static assets`);
  }
  
  return {
    maxCapacity,
    metrics: {
      totalApiTests,
      successfulApiTests,
      totalSocketTests,
      successfulSocketTests,
      avgResponseTime,
      p95ResponseTime
    }
  };
}

// Main stress test runner
async function runStressTest() {
  try {
    console.log('🚀 Starting Maximum Capacity Stress Test...');
    
    // Find maximum capacity
    const maxCapacity = await findMaximumCapacity();
    
    // Generate report
    const report = generateMaxCapacityReport(maxCapacity);
    
    console.log(`\n🏆 FINAL VERDICT:`);
    console.log(`   Your backend can handle:`);
    console.log(`   - ${maxCapacity.concurrentUsers} concurrent users`);
    console.log(`   - ${maxCapacity.apiCalls} API calls`);
    console.log(`   - ${maxCapacity.socketConnections} socket connections`);
    console.log(`   - ${maxCapacity.throughput.toFixed(2)} requests per second`);
    console.log(`   - ${maxCapacity.successRate.toFixed(1)}% success rate`);
    
    return {
      success: true,
      maxCapacity,
      report
    };
    
  } catch (error) {
    console.error('❌ Stress test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run stress test if this file is executed directly
if (require.main === module) {
  runStressTest()
    .then(result => {
      console.log('\n🎉 Stress test completed!');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Stress test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runStressTest, stressResults }; 