const axios = require('axios');
const io = require('socket.io-client');

console.log('🚀 MAXIMUM CAPACITY STRESS TEST');
console.log('=' .repeat(60));

// Progressive test configuration
const TEST_LEVELS = [
  { users: 10, apiCalls: 20, socketMessages: 10, name: 'BASELINE' },
  { users: 25, apiCalls: 30, socketMessages: 15, name: 'MEDIUM' },
  { users: 50, apiCalls: 50, socketMessages: 25, name: 'HIGH' },
  { users: 100, apiCalls: 100, socketMessages: 50, name: 'EXTREME' }
];

// Test results storage
const results = {
  levels: [],
  maxCapacity: {
    users: 0,
    apiCalls: 0,
    socketConnections: 0,
    throughput: 0,
    successRate: 0
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

// Authenticate user
async function authenticateUser(userData, userIndex) {
  const userId = `user-${userIndex + 1}`;
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: userData.email,
      password: userData.password
    }, { timeout: 10000 });
    
    return response.data.user._id || response.data.token;
  } catch (error) {
    console.error(`❌ Auth failed for ${userId}:`, error.response?.data?.message || error.message);
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
    return { success: true, responseTime, status: response.status };
  } catch (error) {
    const responseTime = Date.now() - startTime;
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
      resolve({ socket, success: true });
    });
    
    socket.on('connect_error', (error) => {
      resolve({ socket: null, success: false, error: error.message });
    });
    
    setTimeout(() => {
      if (!socket.connected) {
        resolve({ socket: null, success: false, error: 'Timeout' });
      }
    }, 5000);
  });
}

// Simulate user activity
async function simulateUser(userData, userIndex, config) {
  const userId = `user-${userIndex + 1}`;
  
  // Authenticate
  const token = await authenticateUser(userData, userIndex);
  if (!token) {
    return { userId, success: false, error: 'Authentication failed' };
  }
  
  // Make API calls
  const apiEndpoints = [
    '/health',
    '/posts',
    '/api/chat/users',
    '/posts/category/technology',
    '/posts/categories?categories=technology,design'
  ];
  
  const apiPromises = [];
  for (let i = 0; i < config.apiCalls; i++) {
    const endpoint = apiEndpoints[i % apiEndpoints.length];
    const delay = i * 50; // 50ms between calls
    
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
    for (let i = 0; i < config.socketMessages; i++) {
      setTimeout(() => {
        socket.emit('send_message', {
          sender: userId,
          receiver: 'test-receiver',
          content: `Test message ${i + 1} from ${userId}`
        });
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

// Run single test level
async function runTestLevel(level, levelIndex) {
  console.log(`\n🔥 TESTING LEVEL ${levelIndex + 1}: ${level.name}`);
  console.log(`   👥 Users: ${level.users}`);
  console.log(`   📡 API Calls per User: ${level.apiCalls}`);
  console.log(`   💬 Socket Messages per User: ${level.socketMessages}`);
  console.log(`   📊 Expected Total API Calls: ${level.users * level.apiCalls}`);
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  const testUsers = generateTestUsers(level.users);
  
  // Start all users concurrently
  const userPromises = testUsers.map((user, index) => simulateUser(user, index, level));
  
  // Wait for all users to complete
  const userResults = await Promise.all(userPromises);
  
  const totalTime = (Date.now() - startTime) / 1000;
  
  // Calculate metrics
  const authenticatedUsers = userResults.filter(r => r.authenticated).length;
  const socketConnections = userResults.filter(r => r.socketConnected).length;
  
  let totalApiCalls = 0;
  let successfulApiCalls = 0;
  let totalResponseTime = 0;
  
  userResults.forEach(result => {
    if (result.apiResults) {
      result.apiResults.forEach(apiResult => {
        totalApiCalls++;
        if (apiResult.success) {
          successfulApiCalls++;
          totalResponseTime += apiResult.responseTime;
        }
      });
    }
  });
  
  const apiSuccessRate = totalApiCalls > 0 ? (successfulApiCalls / totalApiCalls * 100).toFixed(2) : 0;
  const avgResponseTime = successfulApiCalls > 0 ? (totalResponseTime / successfulApiCalls).toFixed(2) : 0;
  const throughput = totalApiCalls > 0 ? (totalApiCalls / totalTime).toFixed(2) : 0;
  
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
    totalTime: parseFloat(totalTime.toFixed(2))
  };
  
  results.levels.push(levelResult);
  
  // Display results
  console.log(`\n📊 LEVEL ${level.name} RESULTS:`);
  console.log(`   👥 Authenticated Users: ${authenticatedUsers}/${level.users} (${(authenticatedUsers/level.users*100).toFixed(1)}%)`);
  console.log(`   📡 API Calls: ${successfulApiCalls}/${totalApiCalls} (${apiSuccessRate}%)`);
  console.log(`   🔌 Socket Connections: ${socketConnections}/${level.users} (${(socketConnections/level.users*100).toFixed(1)}%)`);
  console.log(`   ⚡ Throughput: ${throughput} req/s`);
  console.log(`   ⏱️  Average Response Time: ${avgResponseTime}ms`);
  console.log(`   ⏱️  Total Time: ${totalTime.toFixed(2)}s`);
  
  // Check if this level passed
  const passed = authenticatedUsers >= level.users * 0.8 && apiSuccessRate >= 80;
  
  if (passed) {
    console.log(`✅ LEVEL ${level.name} PASSED - System can handle this load`);
    
    // Update max capacity if this is better
    if (authenticatedUsers > results.maxCapacity.users) {
      results.maxCapacity = {
        users: authenticatedUsers,
        apiCalls: successfulApiCalls,
        socketConnections,
        throughput: parseFloat(throughput),
        successRate: parseFloat(apiSuccessRate)
      };
    }
  } else {
    console.log(`❌ LEVEL ${level.name} FAILED - System struggling with this load`);
  }
  
  return passed;
}

// Run maximum capacity test
async function runMaximumCapacityTest() {
  console.log('🚀 STARTING MAXIMUM CAPACITY STRESS TEST');
  console.log('📊 Progressive load testing to find true limits');
  console.log('=' .repeat(60));
  
  for (let i = 0; i < TEST_LEVELS.length; i++) {
    const level = TEST_LEVELS[i];
    const passed = await runTestLevel(level, i);
    
    if (!passed) {
      console.log(`\n⚠️  System failed at level ${level.name}. Stopping further tests.`);
      break;
    }
    
    // Small delay between levels
    if (i < TEST_LEVELS.length - 1) {
      console.log('\n⏳ Waiting 5 seconds before next level...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Generate final report
  console.log('\n' + '=' .repeat(60));
  console.log('🏆 MAXIMUM CAPACITY TEST RESULTS');
  console.log('=' .repeat(60));
  
  console.log('\n📊 TEST LEVELS SUMMARY:');
  results.levels.forEach((level, index) => {
    console.log(`\n   ${index + 1}. ${level.level}:`);
    console.log(`      👥 Users: ${level.authenticatedUsers}/${level.users}`);
    console.log(`      📡 API: ${level.successfulApiCalls}/${level.apiCalls} (${level.successRate}%)`);
    console.log(`      🔌 Sockets: ${level.socketConnections}/${level.users}`);
    console.log(`      ⚡ Throughput: ${level.throughput} req/s`);
    console.log(`      ⏱️  Response Time: ${level.avgResponseTime}ms`);
  });
  
  console.log('\n🔥 MAXIMUM ACHIEVED CAPACITY:');
  console.log(`   👥 Concurrent Users: ${results.maxCapacity.users}`);
  console.log(`   📡 API Calls: ${results.maxCapacity.apiCalls}`);
  console.log(`   🔌 Socket Connections: ${results.maxCapacity.socketConnections}`);
  console.log(`   ⚡ Throughput: ${results.maxCapacity.throughput} req/s`);
  console.log(`   ✅ Success Rate: ${results.maxCapacity.successRate}%`);
  
  // Performance assessment
  console.log('\n🎯 PERFORMANCE ASSESSMENT:');
  if (results.maxCapacity.users >= 50) {
    console.log('🏆 EXCELLENT: High concurrent user capacity');
  } else if (results.maxCapacity.users >= 25) {
    console.log('✅ GOOD: Moderate concurrent user capacity');
  } else {
    console.log('⚠️  LIMITED: Low concurrent user capacity');
  }
  
  if (results.maxCapacity.throughput >= 100) {
    console.log('🏆 EXCELLENT: High throughput capacity');
  } else if (results.maxCapacity.throughput >= 50) {
    console.log('✅ GOOD: Moderate throughput capacity');
  } else {
    console.log('⚠️  LIMITED: Low throughput capacity');
  }
  
  if (results.maxCapacity.successRate >= 95) {
    console.log('🏆 EXCELLENT: High reliability');
  } else if (results.maxCapacity.successRate >= 85) {
    console.log('✅ GOOD: Moderate reliability');
  } else {
    console.log('⚠️  LIMITED: Low reliability');
  }
  
  console.log('\n🏆 FINAL VERDICT:');
  console.log(`   Your backend's MAXIMUM capacity is:`);
  console.log(`   - ${results.maxCapacity.users} concurrent authenticated users`);
  console.log(`   - ${results.maxCapacity.throughput} API requests per second`);
  console.log(`   - ${results.maxCapacity.socketConnections} real-time socket connections`);
  console.log(`   - ${results.maxCapacity.successRate}% API success rate`);
  
  console.log('\n🎉 Maximum capacity test completed!');
}

// Run the test
runMaximumCapacityTest().catch(console.error); 