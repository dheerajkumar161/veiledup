const axios = require('axios');
const io = require('socket.io-client');
const { performance } = require('perf_hooks');

// Load Test Configuration
const LOAD_TEST_CONFIG = {
  // User load simulation
  totalUsers: 20, // Test beyond the 10+ claim
  rampUpUsers: 5, // Add users gradually
  rampUpInterval: 2000, // 2 seconds between user additions
  
  // API load simulation
  requestsPerUser: 100, // 20 users × 100 requests = 2000 requests
  requestInterval: 100, // 100ms between requests
  
  // Socket load simulation
  socketMessagesPerUser: 50,
  messageInterval: 200, // 200ms between messages
  
  // Test duration
  testDuration: 60000, // 1 minute
  warmUpTime: 5000, // 5 seconds warm-up
};

// Test data
const testUsers = Array.from({ length: LOAD_TEST_CONFIG.totalUsers }, (_, i) => ({
  id: `user-${i + 1}`,
  email: `loadtest${i + 1}@example.com`,
  password: 'password123',
  name: `Load Test User ${i + 1}`
}));

// Metrics collection
const metrics = {
  apiRequests: {
    total: 0,
    successful: 0,
    failed: 0,
    responseTimes: [],
    errors: []
  },
  socketConnections: {
    total: 0,
    successful: 0,
    failed: 0,
    messages: {
      sent: 0,
      received: 0
    }
  },
  concurrentUsers: {
    active: 0,
    max: 0
  },
  performance: {
    startTime: 0,
    endTime: 0,
    memoryUsage: []
  }
};

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getRandomEndpoint = () => {
  const endpoints = [
    '/health',
    '/posts',
    '/api/chat/users',
    '/posts/category/technology',
    '/posts/categories?categories=technology,design'
  ];
  return endpoints[Math.floor(Math.random() * endpoints.length)];
};

// API Load Testing
async function makeApiRequest(userId, token = null) {
  const startTime = performance.now();
  const endpoint = getRandomEndpoint();
  
  try {
    const config = {
      method: 'GET',
      url: `http://localhost:5000${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 5000
    };
    
    const response = await axios(config);
    const responseTime = performance.now() - startTime;
    
    metrics.apiRequests.total++;
    metrics.apiRequests.successful++;
    metrics.apiRequests.responseTimes.push(responseTime);
    
    return { success: true, responseTime, status: response.status };
  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    metrics.apiRequests.total++;
    metrics.apiRequests.failed++;
    metrics.apiRequests.errors.push({
      userId,
      endpoint,
      error: error.message,
      responseTime
    });
    
    return { success: false, responseTime, error: error.message };
  }
}

// Socket Load Testing
async function createSocketConnection(userId) {
  return new Promise((resolve) => {
    const socket = io('http://localhost:5000', {
      timeout: 5000,
      forceNew: true
    });
    
    const connectStartTime = performance.now();
    
    socket.on('connect', () => {
      const connectTime = performance.now() - connectStartTime;
      metrics.socketConnections.total++;
      metrics.socketConnections.successful++;
      
      console.log(`✅ Socket connected for ${userId} in ${connectTime.toFixed(2)}ms`);
      
      resolve({ socket, connectTime, success: true });
    });
    
    socket.on('connect_error', (error) => {
      const connectTime = performance.now() - connectStartTime;
      metrics.socketConnections.total++;
      metrics.socketConnections.failed++;
      
      console.error(`❌ Socket connection failed for ${userId}:`, error.message);
      resolve({ socket: null, connectTime, success: false, error: error.message });
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!socket.connected) {
        const connectTime = performance.now() - connectStartTime;
        metrics.socketConnections.total++;
        metrics.socketConnections.failed++;
        resolve({ socket: null, connectTime, success: false, error: 'Connection timeout' });
      }
    }, 5000);
  });
}

// User Simulation
async function simulateUser(userData) {
  const { id, email, password } = userData;
  console.log(`👤 Starting user simulation for ${id}`);
  
  // Authenticate user
  let token = null;
  try {
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    });
    token = authResponse.data.token || authResponse.data._id;
    console.log(`✅ User ${id} authenticated`);
  } catch (error) {
    console.error(`❌ Authentication failed for ${id}:`, error.message);
  }
  
  // Create socket connection
  const socketResult = await createSocketConnection(id);
  const { socket } = socketResult;
  
  // Simulate API requests
  const apiPromises = [];
  for (let i = 0; i < LOAD_TEST_CONFIG.requestsPerUser; i++) {
    const delay = i * LOAD_TEST_CONFIG.requestInterval;
    const promise = sleep(delay).then(() => makeApiRequest(id, token));
    apiPromises.push(promise);
  }
  
  // Simulate socket messages
  if (socket && socket.connected) {
    for (let i = 0; i < LOAD_TEST_CONFIG.socketMessagesPerUser; i++) {
      const delay = i * LOAD_TEST_CONFIG.messageInterval;
      setTimeout(() => {
        const messageData = {
          sender: id,
          receiver: 'test-receiver',
          content: `Load test message ${i + 1} from ${id}`
        };
        
        socket.emit('send_message', messageData);
        metrics.socketConnections.messages.sent++;
      }, delay);
    }
    
    // Listen for received messages
    socket.on('receive_message', (data) => {
      metrics.socketConnections.messages.received++;
    });
  }
  
  // Wait for all API requests to complete
  await Promise.all(apiPromises);
  
  // Cleanup
  if (socket) {
    socket.disconnect();
  }
  
  console.log(`✅ User simulation completed for ${id}`);
  return { userId: id, success: true };
}

// Ramp-up Load Testing
async function runRampUpLoadTest() {
  console.log('🚀 Starting Ramp-up Load Test...');
  console.log('=' .repeat(60));
  console.log(`📊 Load Test Configuration:`);
  console.log(`   - Total Users: ${LOAD_TEST_CONFIG.totalUsers}`);
  console.log(`   - Ramp-up Users: ${LOAD_TEST_CONFIG.rampUpUsers}`);
  console.log(`   - Requests per User: ${LOAD_TEST_CONFIG.requestsPerUser}`);
  console.log(`   - Total Expected Requests: ${LOAD_TEST_CONFIG.totalUsers * LOAD_TEST_CONFIG.requestsPerUser}`);
  console.log(`   - Test Duration: ${LOAD_TEST_CONFIG.testDuration / 1000}s`);
  console.log('=' .repeat(60));
  
  metrics.performance.startTime = performance.now();
  
  // Warm-up period
  console.log('\n🔥 Warming up server...');
  await sleep(LOAD_TEST_CONFIG.warmUpTime);
  
  // Ramp-up users gradually
  const userBatches = [];
  for (let i = 0; i < LOAD_TEST_CONFIG.totalUsers; i += LOAD_TEST_CONFIG.rampUpUsers) {
    const batch = testUsers.slice(i, i + LOAD_TEST_CONFIG.rampUpUsers);
    userBatches.push(batch);
  }
  
  const activeUsers = [];
  
  for (let i = 0; i < userBatches.length; i++) {
    const batch = userBatches[i];
    console.log(`\n📈 Adding batch ${i + 1} (${batch.length} users)...`);
    
    // Start user simulations for this batch
    const batchPromises = batch.map(userData => simulateUser(userData));
    activeUsers.push(...batchPromises);
    
    // Update concurrent user count
    metrics.concurrentUsers.active += batch.length;
    metrics.concurrentUsers.max = Math.max(metrics.concurrentUsers.max, metrics.concurrentUsers.active);
    
    console.log(`👥 Active users: ${metrics.concurrentUsers.active}`);
    
    // Wait before adding next batch (except for the last batch)
    if (i < userBatches.length - 1) {
      await sleep(LOAD_TEST_CONFIG.rampUpInterval);
    }
  }
  
  // Wait for all users to complete
  console.log('\n⏳ Waiting for all users to complete...');
  const results = await Promise.all(activeUsers);
  
  metrics.performance.endTime = performance.now();
  
  return results;
}

// Generate Load Test Report
function generateLoadTestReport() {
  const totalTestTime = metrics.performance.endTime - metrics.performance.startTime;
  const avgResponseTime = metrics.apiRequests.responseTimes.length > 0
    ? metrics.apiRequests.responseTimes.reduce((sum, time) => sum + time, 0) / metrics.apiRequests.responseTimes.length
    : 0;
  
  const p95ResponseTime = metrics.apiRequests.responseTimes.length > 0
    ? metrics.apiRequests.responseTimes.sort((a, b) => a - b)[Math.floor(metrics.apiRequests.responseTimes.length * 0.95)]
    : 0;
  
  const p99ResponseTime = metrics.apiRequests.responseTimes.length > 0
    ? metrics.apiRequests.responseTimes.sort((a, b) => a - b)[Math.floor(metrics.apiRequests.responseTimes.length * 0.99)]
    : 0;
  
  const requestsPerSecond = totalTestTime > 0 ? (metrics.apiRequests.total / (totalTestTime / 1000)) : 0;
  
  return {
    // Test Summary
    totalTestTime: `${(totalTestTime / 1000).toFixed(2)}s`,
    totalUsers: LOAD_TEST_CONFIG.totalUsers,
    maxConcurrentUsers: metrics.concurrentUsers.max,
    
    // API Performance
    totalRequests: metrics.apiRequests.total,
    successfulRequests: metrics.apiRequests.successful,
    failedRequests: metrics.apiRequests.failed,
    successRate: `${((metrics.apiRequests.successful / metrics.apiRequests.total) * 100).toFixed(2)}%`,
    requestsPerSecond: `${requestsPerSecond.toFixed(2)} req/s`,
    
    // Response Times
    avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
    p95ResponseTime: `${p95ResponseTime.toFixed(2)}ms`,
    p99ResponseTime: `${p99ResponseTime.toFixed(2)}ms`,
    
    // Socket Performance
    socketConnections: metrics.socketConnections.total,
    successfulSockets: metrics.socketConnections.successful,
    socketSuccessRate: `${((metrics.socketConnections.successful / metrics.socketConnections.total) * 100).toFixed(2)}%`,
    messagesSent: metrics.socketConnections.messages.sent,
    messagesReceived: metrics.socketConnections.messages.received,
    
    // Errors
    totalErrors: metrics.apiRequests.errors.length
  };
}

// Main Load Test Runner
async function runLoadTest() {
  try {
    console.log('🚀 Starting Comprehensive Load Test...');
    
    // Run the ramp-up load test
    const results = await runRampUpLoadTest();
    
    // Generate and display report
    const report = generateLoadTestReport();
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 LOAD TEST RESULTS');
    console.log('=' .repeat(60));
    
    console.log(`⏱️  Total Test Time: ${report.totalTestTime}`);
    console.log(`👥 Max Concurrent Users: ${report.maxConcurrentUsers}`);
    console.log(`📈 Total Requests: ${report.totalRequests}`);
    console.log(`✅ Success Rate: ${report.successRate}`);
    console.log(`⚡ Requests/Second: ${report.requestsPerSecond}`);
    console.log(`⏱️  Average Response Time: ${report.avgResponseTime}`);
    console.log(`📊 95th Percentile: ${report.p95ResponseTime}`);
    console.log(`📊 99th Percentile: ${report.p99ResponseTime}`);
    console.log(`🔌 Socket Success Rate: ${report.socketSuccessRate}`);
    console.log(`📨 Messages Sent/Received: ${report.messagesSent}/${report.messagesReceived}`);
    
    // Scalability Verification
    console.log('\n🎯 SCALABILITY VERIFICATION');
    console.log('=' .repeat(60));
    
    const concurrentUserClaim = report.maxConcurrentUsers >= 10;
    const apiLoadClaim = report.totalRequests >= 500;
    const performanceClaim = report.avgResponseTime < 1000; // Less than 1 second
    const socketClaim = report.socketSuccessRate >= 90; // 90% success rate
    
    console.log(`🔍 10+ Concurrent Users: ${concurrentUserClaim ? '✅ PASSED' : '❌ FAILED'} (${report.maxConcurrentUsers} users)`);
    console.log(`🔍 500+ API Requests: ${apiLoadClaim ? '✅ PASSED' : '❌ FAILED'} (${report.totalRequests} requests)`);
    console.log(`🔍 Good Performance: ${performanceClaim ? '✅ PASSED' : '❌ FAILED'} (${report.avgResponseTime})`);
    console.log(`🔍 Socket Reliability: ${socketClaim ? '✅ PASSED' : '❌ FAILED'} (${report.socketSuccessRate})`);
    
    const overallSuccess = concurrentUserClaim && apiLoadClaim && performanceClaim && socketClaim;
    console.log(`\n🏆 OVERALL RESULT: ${overallSuccess ? '✅ SCALABILITY VERIFIED' : '❌ SCALABILITY ISSUES DETECTED'}`);
    
    // Performance Recommendations
    if (!overallSuccess) {
      console.log('\n💡 RECOMMENDATIONS:');
      if (!concurrentUserClaim) {
        console.log('   - Consider connection pooling for database');
        console.log('   - Implement rate limiting');
        console.log('   - Add load balancing');
      }
      if (!performanceClaim) {
        console.log('   - Optimize database queries');
        console.log('   - Add caching layer');
        console.log('   - Consider database indexing');
      }
      if (!socketClaim) {
        console.log('   - Check Socket.io configuration');
        console.log('   - Monitor server resources');
        console.log('   - Implement connection retry logic');
      }
    }
    
    return {
      success: overallSuccess,
      report,
      metrics
    };
    
  } catch (error) {
    console.error('❌ Load test failed:', error);
    return { success: false, error: error.message };
  }
}

// Export for use in other files
module.exports = {
  runLoadTest,
  metrics,
  LOAD_TEST_CONFIG
};

// Run load test if this file is executed directly
if (require.main === module) {
  runLoadTest()
    .then(result => {
      console.log('\n🎉 Load test completed!');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Load test execution failed:', error);
      process.exit(1);
    });
} 