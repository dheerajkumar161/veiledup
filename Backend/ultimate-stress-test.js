const axios = require('axios');
const io = require('socket.io-client');

console.log('🚀 ULTIMATE STRESS TEST - FINDING ABSOLUTE MAXIMUM CAPACITY');
console.log('=' .repeat(70));

// Ultimate test configuration - Much more aggressive
const ULTIMATE_LEVELS = [
  { users: 25, apiCalls: 50, socketMessages: 25, name: 'BASELINE' },
  { users: 50, apiCalls: 100, socketMessages: 50, name: 'MEDIUM' },
  { users: 100, apiCalls: 200, socketMessages: 100, name: 'HIGH' },
  { users: 200, apiCalls: 300, socketMessages: 150, name: 'EXTREME' },
  { users: 500, apiCalls: 500, socketMessages: 250, name: 'ULTIMATE' }
];

// Test results storage
const results = {
  levels: [],
  absoluteMax: {
    users: 0,
    apiCalls: 0,
    socketConnections: 0,
    throughput: 0,
    successRate: 0,
    responseTime: 0
  },
  breakdown: {
    authSuccess: 0,
    authFailed: 0,
    apiSuccess: 0,
    apiFailed: 0,
    socketSuccess: 0,
    socketFailed: 0
  }
};

// Generate test users
const generateTestUsers = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    email: `loadtest${i + 1}@test.com`,
    password: 'password123',
    name: `Test User ${i + 1}`
  }));
};

// Authenticate user with retry
async function authenticateUser(userData, userIndex, retries = 2) {
  const userId = `user-${userIndex + 1}`;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: userData.email,
        password: userData.password
      }, { 
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.data.user._id || response.data.token;
    } catch (error) {
      if (attempt === retries) {
        console.error(`❌ Auth failed for ${userId} after ${retries + 1} attempts`);
        results.breakdown.authFailed++;
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
    }
  }
}

// Make API request with retry
async function makeApiRequest(userId, token, endpoint, retries = 1) {
  const startTime = Date.now();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(`http://localhost:5000${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      return { success: true, responseTime, status: response.status };
    } catch (error) {
      if (attempt === retries) {
        const responseTime = Date.now() - startTime;
        return { success: false, responseTime, error: error.message };
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
    }
  }
}

// Create socket connection with retry
function createSocketConnection(userId, retries = 2) {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const tryConnect = () => {
      attempts++;
      const socket = io('http://localhost:5000', {
        timeout: 10000,
        forceNew: true,
        transports: ['websocket', 'polling']
      });
      
      socket.on('connect', () => {
        resolve({ socket, success: true });
      });
      
      socket.on('connect_error', (error) => {
        if (attempts <= retries) {
          setTimeout(tryConnect, 1000);
        } else {
          console.error(`❌ Socket failed for ${userId} after ${retries + 1} attempts`);
          results.breakdown.socketFailed++;
          resolve({ socket: null, success: false, error: error.message });
        }
      });
      
      setTimeout(() => {
        if (!socket.connected && attempts <= retries) {
          socket.disconnect();
          setTimeout(tryConnect, 1000);
        } else if (!socket.connected) {
          results.breakdown.socketFailed++;
          resolve({ socket: null, success: false, error: 'Timeout' });
        }
      }, 10000);
    };
    
    tryConnect();
  });
}

// Simulate user activity with maximum intensity
async function simulateUser(userData, userIndex, config) {
  const userId = `user-${userIndex + 1}`;
  
  // Authenticate
  const token = await authenticateUser(userData, userIndex);
  if (!token) {
    return { userId, success: false, error: 'Authentication failed' };
  }
  
  results.breakdown.authSuccess++;
  
  // Make API calls with maximum intensity
  const apiEndpoints = [
    '/health',
    '/posts',
    '/api/chat/users',
    '/posts/category/technology',
    '/posts/categories?categories=technology,design',
    '/api/auth/users'
  ];
  
  const apiPromises = [];
  for (let i = 0; i < config.apiCalls; i++) {
    const endpoint = apiEndpoints[i % apiEndpoints.length];
    const delay = i * 20; // 20ms between calls for maximum intensity
    
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
    results.breakdown.socketSuccess++;
    
    // Send messages with maximum intensity
    for (let i = 0; i < config.socketMessages; i++) {
      setTimeout(() => {
        socket.emit('send_message', {
          sender: userId,
          receiver: 'test-receiver',
          content: `Ultimate test message ${i + 1} from ${userId}`
        });
      }, i * 50); // 50ms between messages for maximum intensity
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

// Run single ultimate test level
async function runUltimateLevel(level, levelIndex) {
  console.log(`\n🔥 ULTIMATE LEVEL ${levelIndex + 1}: ${level.name}`);
  console.log(`   👥 Users: ${level.users}`);
  console.log(`   📡 API Calls per User: ${level.apiCalls}`);
  console.log(`   💬 Socket Messages per User: ${level.socketMessages}`);
  console.log(`   📊 Expected Total API Calls: ${level.users * level.apiCalls}`);
  console.log(`   🔥 Expected Total Socket Messages: ${level.users * level.socketMessages}`);
  console.log('=' .repeat(70));
  
  const startTime = Date.now();
  const testUsers = generateTestUsers(level.users);
  
  // Start all users concurrently
  const userPromises = testUsers.map((user, index) => simulateUser(user, index, level));
  
  // Wait for all users to complete
  const userResults = await Promise.all(userPromises);
  
  const totalTime = (Date.now() - startTime) / 1000;
  
  // Calculate comprehensive metrics
  const authenticatedUsers = userResults.filter(r => r.authenticated).length;
  const socketConnections = userResults.filter(r => r.socketConnected).length;
  
  let totalApiCalls = 0;
  let successfulApiCalls = 0;
  let totalResponseTime = 0;
  let responseTimes = [];
  
  userResults.forEach(result => {
    if (result.apiResults) {
      result.apiResults.forEach(apiResult => {
        totalApiCalls++;
        if (apiResult.success) {
          successfulApiCalls++;
          totalResponseTime += apiResult.responseTime;
          responseTimes.push(apiResult.responseTime);
        }
      });
    }
  });
  
  const apiSuccessRate = totalApiCalls > 0 ? (successfulApiCalls / totalApiCalls * 100).toFixed(2) : 0;
  const avgResponseTime = successfulApiCalls > 0 ? (totalResponseTime / successfulApiCalls).toFixed(2) : 0;
  const throughput = totalApiCalls > 0 ? (totalApiCalls / totalTime).toFixed(2) : 0;
  
  // Calculate 95th percentile response time
  responseTimes.sort((a, b) => a - b);
  const percentile95 = responseTimes.length > 0 ? 
    responseTimes[Math.floor(responseTimes.length * 0.95)] : 0;
  
  // Store level results
  const levelResult = {
    level: level.name,
    users: level.users,
    authenticatedUsers,
    apiCalls: totalApiCalls,
    successfulApiCalls,
    socketConnections,
    throughput: parseFloat(throughput),
    successRate: parseFloat(apiSuccessRate),
    avgResponseTime: parseFloat(avgResponseTime),
    percentile95ResponseTime: percentile95,
    totalTime: parseFloat(totalTime.toFixed(2))
  };
  
  results.levels.push(levelResult);
  
  // Display comprehensive results
  console.log(`\n📊 ULTIMATE LEVEL ${level.name} RESULTS:`);
  console.log(`   👥 Authenticated Users: ${authenticatedUsers}/${level.users} (${(authenticatedUsers/level.users*100).toFixed(1)}%)`);
  console.log(`   📡 API Calls: ${successfulApiCalls}/${totalApiCalls} (${apiSuccessRate}%)`);
  console.log(`   🔌 Socket Connections: ${socketConnections}/${level.users} (${(socketConnections/level.users*100).toFixed(1)}%)`);
  console.log(`   ⚡ Throughput: ${throughput} req/s`);
  console.log(`   ⏱️  Average Response Time: ${avgResponseTime}ms`);
  console.log(`   📊 95th Percentile Response Time: ${percentile95}ms`);
  console.log(`   ⏱️  Total Time: ${totalTime.toFixed(2)}s`);
  
  // Check if this level passed (more lenient criteria for ultimate test)
  const passed = authenticatedUsers >= level.users * 0.7 && apiSuccessRate >= 70;
  
  if (passed) {
    console.log(`✅ ULTIMATE LEVEL ${level.name} PASSED - System can handle extreme load`);
    
    // Update absolute max if this is better
    if (authenticatedUsers > results.absoluteMax.users) {
      results.absoluteMax = {
        users: authenticatedUsers,
        apiCalls: successfulApiCalls,
        socketConnections,
        throughput: parseFloat(throughput),
        successRate: parseFloat(apiSuccessRate),
        responseTime: parseFloat(avgResponseTime)
      };
    }
  } else {
    console.log(`❌ ULTIMATE LEVEL ${level.name} FAILED - System reached its limits`);
  }
  
  return passed;
}

// Run ultimate stress test
async function runUltimateStressTest() {
  console.log('🚀 STARTING ULTIMATE STRESS TEST');
  console.log('📊 Pushing system to absolute maximum limits');
  console.log('🔥 Testing from 25 to 500 concurrent users');
  console.log('=' .repeat(70));
  
  for (let i = 0; i < ULTIMATE_LEVELS.length; i++) {
    const level = ULTIMATE_LEVELS[i];
    const passed = await runUltimateLevel(level, i);
    
    if (!passed) {
      console.log(`\n⚠️  System failed at ultimate level ${level.name}. This is the absolute maximum.`);
      break;
    }
    
    // Longer delay between ultimate levels
    if (i < ULTIMATE_LEVELS.length - 1) {
      console.log('\n⏳ Waiting 10 seconds before next ultimate level...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // Generate ultimate report
  console.log('\n' + '=' .repeat(70));
  console.log('🏆 ULTIMATE STRESS TEST RESULTS');
  console.log('=' .repeat(70));
  
  console.log('\n📊 ULTIMATE LEVELS SUMMARY:');
  results.levels.forEach((level, index) => {
    console.log(`\n   ${index + 1}. ${level.level}:`);
    console.log(`      👥 Users: ${level.authenticatedUsers}/${level.users}`);
    console.log(`      📡 API: ${level.successfulApiCalls}/${level.apiCalls} (${level.successRate}%)`);
    console.log(`      🔌 Sockets: ${level.socketConnections}/${level.users}`);
    console.log(`      ⚡ Throughput: ${level.throughput} req/s`);
    console.log(`      ⏱️  Avg Response: ${level.avgResponseTime}ms`);
    console.log(`      📊 95th Percentile: ${level.percentile95ResponseTime}ms`);
  });
  
  console.log('\n🔥 ABSOLUTE MAXIMUM CAPACITY ACHIEVED:');
  console.log(`   👥 Concurrent Users: ${results.absoluteMax.users}`);
  console.log(`   📡 API Calls: ${results.absoluteMax.apiCalls}`);
  console.log(`   🔌 Socket Connections: ${results.absoluteMax.socketConnections}`);
  console.log(`   ⚡ Throughput: ${results.absoluteMax.throughput} req/s`);
  console.log(`   ✅ Success Rate: ${results.absoluteMax.successRate}%`);
  console.log(`   ⏱️  Response Time: ${results.absoluteMax.responseTime}ms`);
  
  console.log('\n📊 BREAKDOWN:');
  console.log(`   🔐 Authentication: ${results.breakdown.authSuccess} success, ${results.breakdown.authFailed} failed`);
  console.log(`   📡 API Calls: ${results.breakdown.apiSuccess} success, ${results.breakdown.apiFailed} failed`);
  console.log(`   🔌 Sockets: ${results.breakdown.socketSuccess} success, ${results.breakdown.socketFailed} failed`);
  
  // Ultimate performance assessment
  console.log('\n🎯 ULTIMATE PERFORMANCE ASSESSMENT:');
  if (results.absoluteMax.users >= 200) {
    console.log('🏆 LEGENDARY: Exceptional concurrent user capacity');
  } else if (results.absoluteMax.users >= 100) {
    console.log('🔥 EXCELLENT: High concurrent user capacity');
  } else if (results.absoluteMax.users >= 50) {
    console.log('✅ GOOD: Moderate concurrent user capacity');
  } else {
    console.log('⚠️  LIMITED: Low concurrent user capacity');
  }
  
  if (results.absoluteMax.throughput >= 500) {
    console.log('🏆 LEGENDARY: Exceptional throughput capacity');
  } else if (results.absoluteMax.throughput >= 200) {
    console.log('🔥 EXCELLENT: High throughput capacity');
  } else if (results.absoluteMax.throughput >= 100) {
    console.log('✅ GOOD: Moderate throughput capacity');
  } else {
    console.log('⚠️  LIMITED: Low throughput capacity');
  }
  
  if (results.absoluteMax.successRate >= 95) {
    console.log('🏆 LEGENDARY: Exceptional reliability');
  } else if (results.absoluteMax.successRate >= 85) {
    console.log('🔥 EXCELLENT: High reliability');
  } else if (results.absoluteMax.successRate >= 75) {
    console.log('✅ GOOD: Moderate reliability');
  } else {
    console.log('⚠️  LIMITED: Low reliability');
  }
  
  console.log('\n🏆 FINAL ULTIMATE VERDICT:');
  console.log(`   Your backend's ABSOLUTE MAXIMUM capacity is:`);
  console.log(`   - ${results.absoluteMax.users} concurrent authenticated users`);
  console.log(`   - ${results.absoluteMax.throughput} API requests per second`);
  console.log(`   - ${results.absoluteMax.socketConnections} real-time socket connections`);
  console.log(`   - ${results.absoluteMax.successRate}% API success rate`);
  console.log(`   - ${results.absoluteMax.responseTime}ms average response time`);
  
  console.log('\n🎉 Ultimate stress test completed!');
}

// Run the ultimate test
runUltimateStressTest().catch(console.error); 