const axios = require('axios');
const io = require('socket.io-client');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_CONFIG = {
  concurrentUsers: 15, // Test with 15 users (exceeding the 10+ claim)
  apiCallsPerUser: 50, // 15 users × 50 calls = 750 calls (exceeding 500+ daily)
  socketConnections: 15,
  testDuration: 30000, // 30 seconds
  rampUpTime: 5000, // 5 seconds
};

// Test results storage
const testResults = {
  apiTests: [],
  socketTests: [],
  concurrentTests: [],
  performance: {},
  errors: [],
  summary: {}
};

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomString = (length) => Math.random().toString(36).substring(2, length + 2);

// Test user data
const testUsers = [
  { email: 'test1@example.com', password: 'password123', name: 'Test User 1' },
  { email: 'test2@example.com', password: 'password123', name: 'Test User 2' },
  { email: 'test3@example.com', password: 'password123', name: 'Test User 3' },
  { email: 'test4@example.com', password: 'password123', name: 'Test User 4' },
  { email: 'test5@example.com', password: 'password123', name: 'Test User 5' },
  { email: 'test6@example.com', password: 'password123', name: 'Test User 6' },
  { email: 'test7@example.com', password: 'password123', name: 'Test User 7' },
  { email: 'test8@example.com', password: 'password123', name: 'Test User 8' },
  { email: 'test9@example.com', password: 'password123', name: 'Test User 9' },
  { email: 'test10@example.com', password: 'password123', name: 'Test User 10' },
  { email: 'test11@example.com', password: 'password123', name: 'Test User 11' },
  { email: 'test12@example.com', password: 'password123', name: 'Test User 12' },
  { email: 'test13@example.com', password: 'password123', name: 'Test User 13' },
  { email: 'test14@example.com', password: 'password123', name: 'Test User 14' },
  { email: 'test15@example.com', password: 'password123', name: 'Test User 15' },
];

// Authentication helper
async function authenticateUser(userData) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, userData);
    return response.data.token || response.data._id;
  } catch (error) {
    console.error(`Authentication failed for ${userData.email}:`, error.message);
    return null;
  }
}

// API Endpoint Tests
async function testApiEndpoint(endpoint, method = 'GET', data = null, token = null) {
  const startTime = performance.now();
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data
    };
    
    const response = await axios(config);
    const endTime = performance.now();
    
    return {
      success: true,
      status: response.status,
      responseTime: endTime - startTime,
      data: response.data
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      status: error.response?.status || 0,
      responseTime: endTime - startTime,
      error: error.message
    };
  }
}

// Test individual API endpoints
async function testHealthEndpoint() {
  console.log('🔍 Testing Health Endpoint...');
  const result = await testApiEndpoint('/health');
  testResults.apiTests.push({ endpoint: '/health', ...result });
  return result;
}

async function testPostsEndpoint() {
  console.log('🔍 Testing Posts Endpoint...');
  const result = await testApiEndpoint('/posts');
  testResults.apiTests.push({ endpoint: '/posts', ...result });
  return result;
}

async function testAuthEndpoints() {
  console.log('🔍 Testing Authentication Endpoints...');
  
  // Test registration
  const registerData = {
    name: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'password123'
  };
  
  const registerResult = await testApiEndpoint('/api/auth/register', 'POST', registerData);
  testResults.apiTests.push({ endpoint: '/api/auth/register', ...registerResult });
  
  // Test login
  const loginResult = await testApiEndpoint('/api/auth/login', 'POST', {
    email: registerData.email,
    password: registerData.password
  });
  testResults.apiTests.push({ endpoint: '/api/auth/login', ...loginResult });
  
  return { registerResult, loginResult };
}

async function testChatEndpoints(token) {
  console.log('🔍 Testing Chat Endpoints...');
  
  const endpoints = [
    '/api/chat/users',
    '/api/chat/send',
    '/api/chat/123' // Test with dummy user ID
  ];
  
  const results = [];
  for (const endpoint of endpoints) {
    const data = endpoint === '/api/chat/send' ? {
      sender: '123',
      receiver: '456',
      content: 'Test message'
    } : null;
    
    const result = await testApiEndpoint(endpoint, endpoint === '/api/chat/send' ? 'POST' : 'GET', data, token);
    testResults.apiTests.push({ endpoint, ...result });
    results.push(result);
  }
  
  return results;
}

// Socket.io Tests
async function testSocketConnection(userId) {
  return new Promise((resolve) => {
    const socket = io(BASE_URL);
    const startTime = performance.now();
    
    socket.on('connect', () => {
      const connectTime = performance.now() - startTime;
      console.log(`✅ Socket connected for user ${userId} in ${connectTime.toFixed(2)}ms`);
      
      // Join user room
      socket.emit('join', userId);
      
      // Test sending a message
      const messageData = {
        sender: userId,
        receiver: 'test-receiver',
        content: `Test message from user ${userId}`
      };
      
      socket.emit('send_message', messageData);
      
      // Listen for received message
      socket.on('receive_message', (data) => {
        console.log(`📨 Message received for user ${userId}:`, data.content);
      });
      
      testResults.socketTests.push({
        userId,
        success: true,
        connectTime,
        socketId: socket.id
      });
      
      resolve({ socket, connectTime });
    });
    
    socket.on('connect_error', (error) => {
      const connectTime = performance.now() - startTime;
      console.error(`❌ Socket connection failed for user ${userId}:`, error.message);
      
      testResults.socketTests.push({
        userId,
        success: false,
        connectTime,
        error: error.message
      });
      
      resolve({ socket: null, connectTime });
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!socket.connected) {
        console.error(`⏰ Socket connection timeout for user ${userId}`);
        resolve({ socket: null, connectTime: 5000 });
      }
    }, 5000);
  });
}

// Concurrent User Simulation
async function simulateConcurrentUsers() {
  console.log(`🚀 Starting concurrent user simulation with ${TEST_CONFIG.concurrentUsers} users...`);
  
  const userPromises = testUsers.slice(0, TEST_CONFIG.concurrentUsers).map(async (userData, index) => {
    const userId = `user-${index + 1}`;
    console.log(`👤 Simulating user ${userId} (${userData.name})`);
    
    // Authenticate user
    const token = await authenticateUser(userData);
    if (!token) {
      console.error(`❌ Failed to authenticate user ${userId}`);
      return { userId, success: false, error: 'Authentication failed' };
    }
    
    // Test API calls
    const apiResults = [];
    for (let i = 0; i < TEST_CONFIG.apiCallsPerUser; i++) {
      const endpoints = ['/health', '/posts', '/api/chat/users'];
      const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      const result = await testApiEndpoint(randomEndpoint, 'GET', null, token);
      apiResults.push(result);
      
      // Small delay between calls
      await sleep(100);
    }
    
    // Test socket connection
    const socketResult = await testSocketConnection(userId);
    
    return {
      userId,
      success: true,
      token,
      apiResults,
      socketResult
    };
  });
  
  const results = await Promise.all(userPromises);
  testResults.concurrentTests = results;
  
  return results;
}

// Performance Monitoring
function startPerformanceMonitoring() {
  const startTime = performance.now();
  const initialMemory = process.memoryUsage();
  
  return {
    startTime,
    initialMemory,
    getMetrics: () => {
      const currentTime = performance.now();
      const currentMemory = process.memoryUsage();
      
      return {
        elapsedTime: currentTime - startTime,
        memoryUsage: {
          rss: currentMemory.rss - initialMemory.rss,
          heapUsed: currentMemory.heapUsed - initialMemory.heapUsed,
          heapTotal: currentMemory.heapTotal - initialMemory.heapTotal
        }
      };
    }
  };
}

// Generate Test Report
function generateTestReport() {
  const totalApiCalls = testResults.apiTests.length;
  const successfulApiCalls = testResults.apiTests.filter(test => test.success).length;
  const totalSocketConnections = testResults.socketTests.length;
  const successfulSocketConnections = testResults.socketTests.filter(test => test.success).length;
  const concurrentUsers = testResults.concurrentTests.length;
  const successfulConcurrentUsers = testResults.concurrentTests.filter(test => test.success).length;
  
  const avgResponseTime = testResults.apiTests.length > 0 
    ? testResults.apiTests.reduce((sum, test) => sum + test.responseTime, 0) / testResults.apiTests.length 
    : 0;
  
  const avgSocketConnectTime = testResults.socketTests.length > 0
    ? testResults.socketTests.reduce((sum, test) => sum + (test.connectTime || 0), 0) / testResults.socketTests.length
    : 0;
  
  testResults.summary = {
    totalApiCalls,
    successfulApiCalls,
    apiSuccessRate: (successfulApiCalls / totalApiCalls * 100).toFixed(2) + '%',
    totalSocketConnections,
    successfulSocketConnections,
    socketSuccessRate: (successfulSocketConnections / totalSocketConnections * 100).toFixed(2) + '%',
    concurrentUsers,
    successfulConcurrentUsers,
    concurrentSuccessRate: (successfulConcurrentUsers / concurrentUsers * 100).toFixed(2) + '%',
    avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
    avgSocketConnectTime: avgSocketConnectTime.toFixed(2) + 'ms',
    errors: testResults.errors.length
  };
  
  return testResults.summary;
}

// Main Test Runner
async function runScalabilityTests() {
  console.log('🚀 Starting Scalability Tests...');
  console.log('=' .repeat(60));
  console.log(`📊 Test Configuration:`);
  console.log(`   - Concurrent Users: ${TEST_CONFIG.concurrentUsers}`);
  console.log(`   - API Calls per User: ${TEST_CONFIG.apiCallsPerUser}`);
  console.log(`   - Total Expected API Calls: ${TEST_CONFIG.concurrentUsers * TEST_CONFIG.apiCallsPerUser}`);
  console.log(`   - Socket Connections: ${TEST_CONFIG.socketConnections}`);
  console.log('=' .repeat(60));
  
  const performanceMonitor = startPerformanceMonitoring();
  
  try {
    // Step 1: Basic API Tests
    console.log('\n📋 Step 1: Basic API Endpoint Tests');
    await testHealthEndpoint();
    await testPostsEndpoint();
    await testAuthEndpoints();
    
    // Step 2: Socket.io Tests
    console.log('\n📋 Step 2: Socket.io Connection Tests');
    const socketPromises = testUsers.slice(0, TEST_CONFIG.socketConnections).map((user, index) => 
      testSocketConnection(`user-${index + 1}`)
    );
    await Promise.all(socketPromises);
    
    // Step 3: Concurrent User Simulation
    console.log('\n📋 Step 3: Concurrent User Simulation');
    await simulateConcurrentUsers();
    
    // Step 4: Generate Report
    console.log('\n📋 Step 4: Generating Test Report');
    const report = generateTestReport();
    
    // Display Results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 SCALABILITY TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`✅ API Calls: ${report.successfulApiCalls}/${report.totalApiCalls} (${report.apiSuccessRate})`);
    console.log(`✅ Socket Connections: ${report.successfulSocketConnections}/${report.totalSocketConnections} (${report.socketSuccessRate})`);
    console.log(`✅ Concurrent Users: ${report.successfulConcurrentUsers}/${report.concurrentUsers} (${report.concurrentSuccessRate})`);
    console.log(`⏱️  Average API Response Time: ${report.avgResponseTime}`);
    console.log(`⏱️  Average Socket Connect Time: ${report.avgSocketConnectTime}`);
    console.log(`❌ Total Errors: ${report.errors}`);
    
    // Scalability Claims Verification
    console.log('\n🎯 SCALABILITY CLAIMS VERIFICATION');
    console.log('=' .repeat(60));
    
    const concurrentUserClaim = report.successfulConcurrentUsers >= 10;
    const apiCallClaim = report.totalApiCalls >= 500;
    const socketClaim = report.successfulSocketConnections >= 10;
    
    console.log(`🔍 10+ Concurrent Users: ${concurrentUserClaim ? '✅ PASSED' : '❌ FAILED'} (${report.successfulConcurrentUsers} users)`);
    console.log(`🔍 500+ Daily API Calls: ${apiCallClaim ? '✅ PASSED' : '❌ FAILED'} (${report.totalApiCalls} calls)`);
    console.log(`🔍 Real-time Chat Support: ${socketClaim ? '✅ PASSED' : '❌ FAILED'} (${report.successfulSocketConnections} connections)`);
    
    const overallSuccess = concurrentUserClaim && apiCallClaim && socketClaim;
    console.log(`\n🏆 OVERALL RESULT: ${overallSuccess ? '✅ ALL CLAIMS VERIFIED' : '❌ SOME CLAIMS FAILED'}`);
    
    // Performance Metrics
    const metrics = performanceMonitor.getMetrics();
    console.log('\n📈 PERFORMANCE METRICS');
    console.log('=' .repeat(60));
    console.log(`⏱️  Total Test Duration: ${(metrics.elapsedTime / 1000).toFixed(2)}s`);
    console.log(`💾 Memory Usage Increase: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    return {
      success: overallSuccess,
      report,
      metrics
    };
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.errors.push(error.message);
    return { success: false, error: error.message };
  }
}

// Export for use in other files
module.exports = {
  runScalabilityTests,
  testResults,
  TEST_CONFIG
};

// Run tests if this file is executed directly
if (require.main === module) {
  runScalabilityTests()
    .then(result => {
      console.log('\n🎉 Scalability tests completed!');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
} 