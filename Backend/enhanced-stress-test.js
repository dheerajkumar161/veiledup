const axios = require('axios');
const io = require('socket.io-client');
require('dotenv').config();

console.log('🚀 ENHANCED STRESS TEST - COMPREHENSIVE CAPACITY ANALYSIS');
console.log('=' .repeat(70));

// Environment-based configuration
const CONFIG = {
  concurrentUsers: parseInt(process.env.TEST_CONCURRENT_USERS) || 50,
  apiCallsPerUser: parseInt(process.env.TEST_API_CALLS_PER_USER) || 100,
  socketMessagesPerUser: parseInt(process.env.TEST_SOCKET_MESSAGES_PER_USER) || 50,
  timeout: parseInt(process.env.TEST_TIMEOUT) || 10000,
  duration: parseInt(process.env.TEST_DURATION) || 60,
  socketTimeout: parseInt(process.env.SOCKET_TIMEOUT) || 5000,
  socketRetries: parseInt(process.env.SOCKET_RETRY_ATTEMPTS) || 3
};

// Performance thresholds
const THRESHOLDS = {
  successRate: parseInt(process.env.THRESHOLD_SUCCESS_RATE) || 85,
  responseTime: parseInt(process.env.THRESHOLD_RESPONSE_TIME) || 500,
  throughput: parseInt(process.env.THRESHOLD_THROUGHPUT) || 100
};

// Comprehensive test results
const results = {
  auth: { success: 0, failed: 0, responseTimes: [] },
  api: { success: 0, failed: 0, responseTimes: [], errors: [] },
  socket: { 
    success: 0, 
    failed: 0, 
    connectTimes: [], 
    messageDelivered: 0,
    messageFailed: 0,
    droppedConnections: 0
  },
  latency: {
    p50: 0,
    p90: 0,
    p95: 0,
    p99: 0,
    min: Infinity,
    max: 0
  },
  startTime: Date.now()
};

// Generate test users
const generateTestUsers = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    email: `loadtest${i + 1}@test.com`,
    password: 'password123',
    name: `Test User ${i + 1}`
  }));
};

// Calculate percentiles
function calculatePercentiles(responseTimes) {
  if (responseTimes.length === 0) return { p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0 };
  
  const sorted = responseTimes.sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    p50: sorted[Math.floor(len * 0.5)],
    p90: sorted[Math.floor(len * 0.9)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)],
    min: sorted[0],
    max: sorted[len - 1]
  };
}

// Enhanced authentication with timing
async function authenticateUser(userData, userIndex) {
  const userId = `user-${userIndex + 1}`;
  const startTime = Date.now();
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: userData.email,
      password: userData.password
    }, { 
      timeout: CONFIG.timeout,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const responseTime = Date.now() - startTime;
    results.auth.success++;
    results.auth.responseTimes.push(responseTime);
    
    console.log(`✅ [${userId}] Auth successful (${responseTime}ms)`);
    return response.data.user._id;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    results.auth.failed++;
    results.auth.responseTimes.push(responseTime);
    
    console.error(`❌ [${userId}] Auth failed: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Enhanced API call with detailed tracking
async function makeApiRequest(userId, token, endpoint, requestId) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`http://localhost:5000${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: CONFIG.timeout
    });
    
    const responseTime = Date.now() - startTime;
    results.api.success++;
    results.api.responseTimes.push(responseTime);
    
    return { 
      success: true, 
      responseTime, 
      status: response.status,
      requestId 
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    results.api.failed++;
    results.api.responseTimes.push(responseTime);
    results.api.errors.push(`${endpoint}: ${error.response?.data?.message || error.message}`);
    
    return { 
      success: false, 
      responseTime, 
      error: error.message,
      requestId 
    };
  }
}

// Enhanced socket connection with message validation
function createSocketConnection(userId) {
  return new Promise((resolve) => {
    const connectStartTime = Date.now();
    let retryCount = 0;
    
    const tryConnect = () => {
      const socket = io('http://localhost:5000', {
        timeout: CONFIG.socketTimeout,
        forceNew: true,
        transports: ['websocket', 'polling']
      });
      
      socket.on('connect', () => {
        const connectTime = Date.now() - connectStartTime;
        results.socket.success++;
        results.socket.connectTimes.push(connectTime);
        
        console.log(`🔌 [${userId}] Socket connected (${connectTime}ms)`);
        
        // Listen for message acknowledgments
        socket.on('message_received', (data) => {
          results.socket.messageDelivered++;
        });
        
        socket.on('disconnect', (reason) => {
          if (reason === 'io server disconnect') {
            results.socket.droppedConnections++;
            console.log(`⚠️ [${userId}] Socket dropped by server`);
          }
        });
        
        resolve({ socket, success: true, connectTime });
      });
      
      socket.on('connect_error', (error) => {
        retryCount++;
        if (retryCount < CONFIG.socketRetries) {
          console.log(`🔄 [${userId}] Socket retry ${retryCount}/${CONFIG.socketRetries}`);
          setTimeout(tryConnect, 1000);
        } else {
          const connectTime = Date.now() - connectStartTime;
          results.socket.failed++;
          results.socket.connectTimes.push(connectTime);
          console.error(`❌ [${userId}] Socket failed after ${CONFIG.socketRetries} retries`);
          resolve({ socket: null, success: false, error: error.message });
        }
      });
      
      setTimeout(() => {
        if (!socket.connected && retryCount < CONFIG.socketRetries) {
          socket.disconnect();
          setTimeout(tryConnect, 1000);
        } else if (!socket.connected) {
          const connectTime = Date.now() - connectStartTime;
          results.socket.failed++;
          results.socket.connectTimes.push(connectTime);
          resolve({ socket: null, success: false, error: 'Timeout' });
        }
      }, CONFIG.socketTimeout);
    };
    
    tryConnect();
  });
}

// Simulate user with comprehensive tracking
async function simulateUser(userData, userIndex) {
  const userId = `user-${userIndex + 1}`;
  
  // Authenticate
  const token = await authenticateUser(userData, userIndex);
  if (!token) {
    return { userId, success: false, error: 'Authentication failed' };
  }
  
  // Make API calls with request tracking
  const apiEndpoints = [
    '/health',
    '/posts',
    '/api/chat/users',
    '/posts/category/technology',
    '/posts/categories?categories=technology,design'
  ];
  
  const apiPromises = [];
  for (let i = 0; i < CONFIG.apiCallsPerUser; i++) {
    const endpoint = apiEndpoints[i % apiEndpoints.length];
    const requestId = `${userId}-api-${i}`;
    const delay = i * 50; // 50ms between calls
    
    const promise = new Promise(resolve => {
      setTimeout(async () => {
        const result = await makeApiRequest(userId, token, endpoint, requestId);
        resolve(result);
      }, delay);
    });
    
    apiPromises.push(promise);
  }
  
  // Create socket connection
  const socketResult = await createSocketConnection(userId);
  const { socket } = socketResult;
  
  if (socket && socket.connected) {
    // Send messages with delivery tracking
    for (let i = 0; i < CONFIG.socketMessagesPerUser; i++) {
      setTimeout(() => {
        const messageData = {
          sender: userId,
          receiver: 'test-receiver',
          content: `Enhanced test message ${i + 1} from ${userId}`,
          timestamp: Date.now()
        };
        
        socket.emit('send_message', messageData);
        
        // Track message delivery
        setTimeout(() => {
          results.socket.messageFailed++;
        }, 5000); // Assume failed if no acknowledgment in 5s
      }, i * 100); // 100ms between messages
    }
  }
  
  // Wait for API calls to complete
  const apiResults = await Promise.all(apiPromises);
  
  return { 
    userId, 
    success: true, 
    authenticated: true,
    socketConnected: socket && socket.connected,
    apiResults 
  };
}

// Run enhanced stress test
async function runEnhancedStressTest() {
  console.log('🚀 STARTING ENHANCED STRESS TEST');
  console.log('📊 Environment-based configuration:');
  console.log(`   👥 Concurrent Users: ${CONFIG.concurrentUsers}`);
  console.log(`   📡 API Calls per User: ${CONFIG.apiCallsPerUser}`);
  console.log(`   💬 Socket Messages per User: ${CONFIG.socketMessagesPerUser}`);
  console.log(`   ⏱️  Timeout: ${CONFIG.timeout}ms`);
  console.log(`   🔌 Socket Timeout: ${CONFIG.socketTimeout}ms`);
  console.log('=' .repeat(70));
  
  const testUsers = generateTestUsers(CONFIG.concurrentUsers);
  
  // Start all users concurrently
  const userPromises = testUsers.map((user, index) => simulateUser(user, index));
  
  // Wait for all users to complete
  const userResults = await Promise.all(userPromises);
  
  const totalTime = (Date.now() - results.startTime) / 1000;
  
  // Calculate comprehensive metrics
  const authenticatedUsers = userResults.filter(r => r.authenticated).length;
  const socketConnections = userResults.filter(r => r.socketConnected).length;
  
  const totalApiCalls = results.api.success + results.api.failed;
  const apiSuccessRate = totalApiCalls > 0 ? (results.api.success / totalApiCalls * 100).toFixed(2) : 0;
  const throughput = totalApiCalls > 0 ? (totalApiCalls / totalTime).toFixed(2) : 0;
  
  // Calculate latency percentiles
  const apiLatency = calculatePercentiles(results.api.responseTimes);
  const authLatency = calculatePercentiles(results.auth.responseTimes);
  const socketLatency = calculatePercentiles(results.socket.connectTimes);
  
  // Display comprehensive results
  console.log('\n' + '=' .repeat(70));
  console.log('📊 ENHANCED STRESS TEST RESULTS');
  console.log('=' .repeat(70));
  
  console.log(`\n👥 USER CAPACITY:`);
  console.log(`   Authenticated Users: ${authenticatedUsers}/${CONFIG.concurrentUsers} (${(authenticatedUsers/CONFIG.concurrentUsers*100).toFixed(1)}%)`);
  console.log(`   Socket Connections: ${socketConnections}/${CONFIG.concurrentUsers} (${(socketConnections/CONFIG.concurrentUsers*100).toFixed(1)}%)`);
  
  console.log(`\n📡 API PERFORMANCE:`);
  console.log(`   Total API Calls: ${results.api.success}/${totalApiCalls} (${apiSuccessRate}%)`);
  console.log(`   Throughput: ${throughput} req/s`);
  console.log(`   Average Response Time: ${(results.api.responseTimes.reduce((a, b) => a + b, 0) / results.api.responseTimes.length).toFixed(0)}ms`);
  
  console.log(`\n📊 LATENCY DISTRIBUTION (API):`);
  console.log(`   50th Percentile: ${apiLatency.p50}ms`);
  console.log(`   90th Percentile: ${apiLatency.p90}ms`);
  console.log(`   95th Percentile: ${apiLatency.p95}ms ✅`);
  console.log(`   99th Percentile: ${apiLatency.p99}ms`);
  console.log(`   Min/Max: ${apiLatency.min}ms / ${apiLatency.max}ms`);
  
  console.log(`\n🔌 SOCKET PERFORMANCE:`);
  console.log(`   Connection Success: ${results.socket.success}/${CONFIG.concurrentUsers}`);
  console.log(`   Average Connect Time: ${(results.socket.connectTimes.reduce((a, b) => a + b, 0) / results.socket.connectTimes.length).toFixed(0)}ms`);
  console.log(`   Messages Delivered: ${results.socket.messageDelivered}`);
  console.log(`   Messages Failed: ${results.socket.messageFailed}`);
  console.log(`   Dropped Connections: ${results.socket.droppedConnections}`);
  
  console.log(`\n⏱️  TIMING BREAKDOWN:`);
  console.log(`   Authentication Latency - Avg: ${(results.auth.responseTimes.reduce((a, b) => a + b, 0) / results.auth.responseTimes.length).toFixed(0)}ms`);
  console.log(`   Socket Connect Latency - Avg: ${(results.socket.connectTimes.reduce((a, b) => a + b, 0) / results.socket.connectTimes.length).toFixed(0)}ms`);
  console.log(`   Total Test Time: ${totalTime.toFixed(2)}s`);
  
  // Performance assessment with thresholds
  console.log('\n🎯 PERFORMANCE ASSESSMENT:');
  
  // Authentication assessment
  if (authenticatedUsers >= CONFIG.concurrentUsers * 0.9) {
    console.log('✅ EXCELLENT: High authentication success');
  } else if (authenticatedUsers >= CONFIG.concurrentUsers * 0.7) {
    console.log('⚠️  GOOD: Moderate authentication success');
  } else {
    console.log('❌ POOR: Low authentication success');
  }
  
  // API success rate assessment
  if (parseFloat(apiSuccessRate) >= THRESHOLDS.successRate) {
    console.log(`✅ EXCELLENT: High API success rate (${apiSuccessRate}% >= ${THRESHOLDS.successRate}%)`);
  } else {
    console.log(`❌ POOR: Low API success rate (${apiSuccessRate}% < ${THRESHOLDS.successRate}%)`);
  }
  
  // Throughput assessment
  if (parseFloat(throughput) >= THRESHOLDS.throughput) {
    console.log(`✅ EXCELLENT: High throughput (${throughput} req/s >= ${THRESHOLDS.throughput} req/s)`);
  } else {
    console.log(`❌ POOR: Low throughput (${throughput} req/s < ${THRESHOLDS.throughput} req/s)`);
  }
  
  // 95th percentile response time assessment
  if (apiLatency.p95 <= THRESHOLDS.responseTime) {
    console.log(`✅ EXCELLENT: Fast 95th percentile response time (${apiLatency.p95}ms <= ${THRESHOLDS.responseTime}ms)`);
  } else {
    console.log(`❌ POOR: Slow 95th percentile response time (${apiLatency.p95}ms > ${THRESHOLDS.responseTime}ms)`);
  }
  
  // Socket reliability assessment
  if (results.socket.droppedConnections === 0) {
    console.log('✅ EXCELLENT: No dropped socket connections');
  } else {
    console.log(`⚠️  GOOD: ${results.socket.droppedConnections} dropped socket connections`);
  }
  
  // Overall assessment
  console.log('\n🏆 FINAL VERDICT:');
  const authScore = authenticatedUsers / CONFIG.concurrentUsers;
  const apiScore = results.api.success / totalApiCalls;
  const socketScore = results.socket.success / CONFIG.concurrentUsers;
  const throughputScore = Math.min(parseFloat(throughput) / THRESHOLDS.throughput, 1);
  const latencyScore = Math.max(0, 1 - (apiLatency.p95 - 100) / 400);
  
  const overallScore = (authScore + apiScore + socketScore + throughputScore + latencyScore) / 5;
  
  if (overallScore >= 0.8) {
    console.log('🏆 LEGENDARY: Your backend is exceptionally scalable!');
  } else if (overallScore >= 0.6) {
    console.log('✅ EXCELLENT: Your backend is highly scalable');
  } else if (overallScore >= 0.4) {
    console.log('⚠️  GOOD: Your backend has moderate scalability');
  } else {
    console.log('❌ NEEDS IMPROVEMENT: Your backend needs optimization');
  }
  
  console.log(`📊 Overall Score: ${(overallScore * 100).toFixed(1)}%`);
  
  console.log('\n🎉 Enhanced stress test completed!');
  console.log('📖 Check TESTING_GUIDE.md for detailed interpretation');
}

// Run the enhanced test
runEnhancedStressTest().catch(console.error); 