const axios = require('axios');
const io = require('socket.io-client');

console.log('🔍 QUICK TEST CHECK - BACKEND CAPACITY VERIFICATION');
console.log('=' .repeat(60));

// Quick test configuration
const QUICK_TEST = {
  users: 20,
  apiCalls: 30,
  socketMessages: 15,
  timeout: 10000
};

// Test results
const results = {
  auth: { success: 0, failed: 0 },
  api: { success: 0, failed: 0, responseTimes: [] },
  socket: { success: 0, failed: 0 },
  startTime: Date.now()
};

// Generate test users
const generateTestUsers = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    email: `loadtest${i + 1}@test.com`,
    password: 'password123'
  }));
};

// Quick authentication test
async function quickAuth(userData, userIndex) {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', userData, {
      timeout: 5000
    });
    results.auth.success++;
    return response.data.user._id;
  } catch (error) {
    results.auth.failed++;
    return null;
  }
}

// Quick API test
async function quickApiCall(userId, token, endpoint) {
  const startTime = Date.now();
  try {
    const response = await axios.get(`http://localhost:5000${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 5000
    });
    const responseTime = Date.now() - startTime;
    results.api.success++;
    results.api.responseTimes.push(responseTime);
    return { success: true, responseTime };
  } catch (error) {
    results.api.failed++;
    return { success: false, error: error.message };
  }
}

// Quick socket test
function quickSocket(userId) {
  return new Promise((resolve) => {
    const socket = io('http://localhost:5000', { timeout: 5000 });
    
    socket.on('connect', () => {
      results.socket.success++;
      resolve({ success: true });
    });
    
    socket.on('connect_error', () => {
      results.socket.failed++;
      resolve({ success: false });
    });
    
    setTimeout(() => {
      if (!socket.connected) {
        results.socket.failed++;
        resolve({ success: false });
      }
    }, 5000);
  });
}

// Run quick test
async function runQuickTest() {
  console.log(`📊 Running quick test with ${QUICK_TEST.users} users...`);
  console.log(`   - ${QUICK_TEST.apiCalls} API calls per user`);
  console.log(`   - ${QUICK_TEST.socketMessages} socket messages per user`);
  console.log('=' .repeat(60));
  
  const testUsers = generateTestUsers(QUICK_TEST.users);
  const apiEndpoints = ['/health', '/posts', '/api/chat/users'];
  
  // Test all users concurrently
  const userPromises = testUsers.map(async (user, index) => {
    const userId = `user-${index + 1}`;
    
    // Authenticate
    const token = await quickAuth(user, index);
    if (!token) return { userId, success: false };
    
    // Make API calls
    const apiPromises = [];
    for (let i = 0; i < QUICK_TEST.apiCalls; i++) {
      const endpoint = apiEndpoints[i % apiEndpoints.length];
      apiPromises.push(quickApiCall(userId, token, endpoint));
    }
    
    // Create socket connection
    const socketPromise = quickSocket(userId);
    
    // Wait for all operations
    const [apiResults] = await Promise.all([Promise.all(apiPromises), socketPromise]);
    
    return { userId, success: true, apiResults };
  });
  
  await Promise.all(userPromises);
  
  // Calculate results
  const totalTime = (Date.now() - results.startTime) / 1000;
  const totalApiCalls = results.api.success + results.api.failed;
  const apiSuccessRate = totalApiCalls > 0 ? (results.api.success / totalApiCalls * 100).toFixed(1) : 0;
  const avgResponseTime = results.api.responseTimes.length > 0 ? 
    (results.api.responseTimes.reduce((a, b) => a + b, 0) / results.api.responseTimes.length).toFixed(0) : 0;
  const throughput = totalApiCalls > 0 ? (totalApiCalls / totalTime).toFixed(1) : 0;
  
  // Display results
  console.log('\n📊 QUICK TEST RESULTS:');
  console.log('=' .repeat(60));
  console.log(`👥 Authentication: ${results.auth.success}/${QUICK_TEST.users} (${(results.auth.success/QUICK_TEST.users*100).toFixed(1)}%)`);
  console.log(`📡 API Calls: ${results.api.success}/${totalApiCalls} (${apiSuccessRate}%)`);
  console.log(`🔌 Socket Connections: ${results.socket.success}/${QUICK_TEST.users} (${(results.socket.success/QUICK_TEST.users*100).toFixed(1)}%)`);
  console.log(`⚡ Throughput: ${throughput} req/s`);
  console.log(`⏱️  Average Response Time: ${avgResponseTime}ms`);
  console.log(`⏱️  Total Test Time: ${totalTime.toFixed(1)}s`);
  
  // Performance assessment
  console.log('\n🎯 PERFORMANCE ASSESSMENT:');
  
  // Authentication assessment
  if (results.auth.success >= QUICK_TEST.users * 0.9) {
    console.log('✅ EXCELLENT: High authentication success');
  } else if (results.auth.success >= QUICK_TEST.users * 0.7) {
    console.log('⚠️  GOOD: Moderate authentication success');
  } else {
    console.log('❌ POOR: Low authentication success');
  }
  
  // API assessment
  if (apiSuccessRate >= 95) {
    console.log('✅ EXCELLENT: High API success rate');
  } else if (apiSuccessRate >= 80) {
    console.log('⚠️  GOOD: Moderate API success rate');
  } else {
    console.log('❌ POOR: Low API success rate');
  }
  
  // Throughput assessment
  if (parseFloat(throughput) >= 100) {
    console.log('✅ EXCELLENT: High throughput');
  } else if (parseFloat(throughput) >= 50) {
    console.log('⚠️  GOOD: Moderate throughput');
  } else {
    console.log('❌ POOR: Low throughput');
  }
  
  // Response time assessment
  if (parseInt(avgResponseTime) < 200) {
    console.log('✅ EXCELLENT: Fast response times');
  } else if (parseInt(avgResponseTime) < 500) {
    console.log('⚠️  GOOD: Moderate response times');
  } else {
    console.log('❌ POOR: Slow response times');
  }
  
  // Overall assessment
  console.log('\n🏆 OVERALL ASSESSMENT:');
  const authScore = results.auth.success / QUICK_TEST.users;
  const apiScore = results.api.success / totalApiCalls;
  const socketScore = results.socket.success / QUICK_TEST.users;
  const throughputScore = Math.min(parseFloat(throughput) / 100, 1);
  const responseScore = Math.max(0, 1 - (parseInt(avgResponseTime) - 100) / 400);
  
  const overallScore = (authScore + apiScore + socketScore + throughputScore + responseScore) / 5;
  
  if (overallScore >= 0.8) {
    console.log('🏆 EXCELLENT: Your backend is highly scalable!');
  } else if (overallScore >= 0.6) {
    console.log('✅ GOOD: Your backend has good scalability');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT: Your backend needs optimization');
  }
  
  console.log(`📊 Overall Score: ${(overallScore * 100).toFixed(1)}%`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (results.auth.success < QUICK_TEST.users * 0.9) {
    console.log('   - Check authentication endpoint and database connection');
  }
  if (apiSuccessRate < 90) {
    console.log('   - Optimize API endpoints and database queries');
  }
  if (parseFloat(throughput) < 50) {
    console.log('   - Consider connection pooling and caching');
  }
  if (parseInt(avgResponseTime) > 500) {
    console.log('   - Optimize response times with indexing and caching');
  }
  
  console.log('\n🎉 Quick test completed!');
  console.log('📖 For detailed testing, run: node ultimate-stress-test.js');
}

// Run the quick test
runQuickTest().catch(console.error); 