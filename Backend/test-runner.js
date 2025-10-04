const { runScalabilityTests } = require('./scalability-tests');
const { runLoadTest } = require('./load-test');
const { performanceMonitor } = require('./performance-monitor');
const axios = require('axios');

class ScalabilityTestRunner {
  constructor() {
    this.testResults = {
      scalability: null,
      load: null,
      performance: null,
      summary: {}
    };
    this.serverUrl = 'http://localhost:5000';
  }

  async checkServerHealth() {
    console.log('🔍 Checking server health...');
    try {
      const response = await axios.get(`${this.serverUrl}/health`, { timeout: 5000 });
      console.log('✅ Server is healthy:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Server health check failed:', error.message);
      return false;
    }
  }

  async createTestUsers() {
    console.log('👥 Creating test users...');
    try {
      const response = await axios.post(`${this.serverUrl}/api/auth/create-test-users`);
      console.log('✅ Test users created:', response.data.message);
      return true;
    } catch (error) {
      console.error('❌ Failed to create test users:', error.message);
      return false;
    }
  }

  async runScalabilityTests() {
    console.log('\n🚀 Running Scalability Tests...');
    console.log('=' .repeat(60));
    
    const result = await runScalabilityTests();
    this.testResults.scalability = result;
    
    return result;
  }

  async runLoadTests() {
    console.log('\n🚀 Running Load Tests...');
    console.log('=' .repeat(60));
    
    const result = await runLoadTest();
    this.testResults.load = result;
    
    return result;
  }

  async runPerformanceMonitoring() {
    console.log('\n🔍 Starting Performance Monitoring...');
    console.log('=' .repeat(60));
    
    performanceMonitor.start();
    
    // Monitor for 30 seconds during load tests
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    performanceMonitor.stop();
    const report = performanceMonitor.generateReport();
    this.testResults.performance = report;
    
    return report;
  }

  async runAllTests() {
    console.log('🎯 COMPREHENSIVE SCALABILITY VERIFICATION');
    console.log('=' .repeat(60));
    console.log('This will verify your backend claims:');
    console.log('✅ 10+ concurrent users with Socket.io');
    console.log('✅ 500+ daily authenticated API calls');
    console.log('✅ Real-time chat functionality');
    console.log('✅ Performance under load');
    console.log('=' .repeat(60));

    // Step 1: Health Check
    const serverHealthy = await this.checkServerHealth();
    if (!serverHealthy) {
      console.error('❌ Server is not healthy. Please start your backend server first.');
      return { success: false, error: 'Server not healthy' };
    }

    // Step 2: Create Test Users
    const usersCreated = await this.createTestUsers();
    if (!usersCreated) {
      console.warn('⚠️  Failed to create test users, continuing with existing users...');
    }

    // Step 3: Start Performance Monitoring
    performanceMonitor.start();

    // Step 4: Run Scalability Tests
    const scalabilityResult = await this.runScalabilityTests();

    // Step 5: Run Load Tests
    const loadResult = await this.runLoadTests();

    // Step 6: Stop Performance Monitoring
    performanceMonitor.stop();
    const performanceResult = performanceMonitor.generateReport();

    // Step 7: Generate Final Report
    const finalReport = this.generateFinalReport(scalabilityResult, loadResult, performanceResult);

    return finalReport;
  }

  generateFinalReport(scalabilityResult, loadResult, performanceResult) {
    console.log('\n📊 FINAL SCALABILITY VERIFICATION REPORT');
    console.log('=' .repeat(60));

    // Extract key metrics
    const scalabilitySuccess = scalabilityResult?.success || false;
    const loadSuccess = loadResult?.success || false;
    const concurrentUsers = loadResult?.report?.maxConcurrentUsers || 0;
    const totalRequests = loadResult?.report?.totalRequests || 0;
    const avgResponseTime = loadResult?.report?.avgResponseTime || 'N/A';
    const socketSuccessRate = loadResult?.report?.socketSuccessRate || 'N/A';

    // Verify claims
    const claims = {
      concurrentUsers: concurrentUsers >= 10,
      apiCalls: totalRequests >= 500,
      realTimeChat: parseFloat(socketSuccessRate) >= 90,
      performance: parseFloat(avgResponseTime) < 1000
    };

    console.log('🎯 CLAIMS VERIFICATION:');
    console.log(`   ✅ 10+ Concurrent Users: ${claims.concurrentUsers ? 'PASSED' : 'FAILED'} (${concurrentUsers} users)`);
    console.log(`   ✅ 500+ API Calls: ${claims.apiCalls ? 'PASSED' : 'FAILED'} (${totalRequests} calls)`);
    console.log(`   ✅ Real-time Chat: ${claims.realTimeChat ? 'PASSED' : 'FAILED'} (${socketSuccessRate} success rate)`);
    console.log(`   ✅ Performance: ${claims.performance ? 'PASSED' : 'FAILED'} (${avgResponseTime} avg response)`);

    const overallSuccess = Object.values(claims).every(claim => claim);

    console.log('\n📈 PERFORMANCE METRICS:');
    if (performanceResult) {
      console.log(`   🖥️  Average CPU Usage: ${performanceResult.averageMetrics?.avgCpuUsage?.toFixed(2) || 'N/A'}%`);
      console.log(`   💾 Average Memory Usage: ${performanceResult.averageMetrics?.avgMemoryUsage?.toFixed(2) || 'N/A'}%`);
      console.log(`   ⏱️  Monitoring Duration: ${performanceResult.monitoringDuration || 'N/A'}`);
    }

    console.log('\n🔧 SYSTEM RECOMMENDATIONS:');
    if (performanceResult?.recommendations) {
      performanceResult.recommendations.forEach(rec => console.log(`   ${rec}`));
    }

    if (!overallSuccess) {
      console.log('\n💡 IMPROVEMENT SUGGESTIONS:');
      if (!claims.concurrentUsers) {
        console.log('   - Implement connection pooling');
        console.log('   - Add load balancing');
        console.log('   - Optimize database queries');
      }
      if (!claims.performance) {
        console.log('   - Add caching layer (Redis)');
        console.log('   - Implement database indexing');
        console.log('   - Consider microservices architecture');
      }
      if (!claims.realTimeChat) {
        console.log('   - Review Socket.io configuration');
        console.log('   - Implement connection retry logic');
        console.log('   - Monitor server resources');
      }
    }

    console.log('\n🏆 FINAL VERDICT:');
    console.log(`   ${overallSuccess ? '✅ ALL CLAIMS VERIFIED' : '❌ SOME CLAIMS NEED IMPROVEMENT'}`);

    return {
      success: overallSuccess,
      claims,
      metrics: {
        concurrentUsers,
        totalRequests,
        avgResponseTime,
        socketSuccessRate
      },
      performance: performanceResult,
      recommendations: performanceResult?.recommendations || []
    };
  }

  async runQuickTest() {
    console.log('⚡ Running Quick Scalability Test...');
    
    const serverHealthy = await this.checkServerHealth();
    if (!serverHealthy) {
      return { success: false, error: 'Server not healthy' };
    }

    // Quick API test
    const apiTest = await axios.get(`${this.serverUrl}/posts`, { timeout: 5000 });
    const apiSuccess = apiTest.status === 200;

    // Quick socket test
    const io = require('socket.io-client');
    const socket = io(this.serverUrl, { timeout: 5000 });
    
    const socketTest = new Promise((resolve) => {
      socket.on('connect', () => {
        socket.disconnect();
        resolve(true);
      });
      
      socket.on('connect_error', () => {
        resolve(false);
      });
      
      setTimeout(() => resolve(false), 5000);
    });

    const socketSuccess = await socketTest;

    const result = {
      success: apiSuccess && socketSuccess,
      apiTest: apiSuccess,
      socketTest: socketSuccess,
      message: apiSuccess && socketSuccess 
        ? '✅ Basic scalability verified' 
        : '❌ Basic scalability issues detected'
    };

    console.log(result.message);
    return result;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new ScalabilityTestRunner();

  if (args.includes('--quick')) {
    await runner.runQuickTest();
  } else if (args.includes('--scalability')) {
    await runner.runScalabilityTests();
  } else if (args.includes('--load')) {
    await runner.runLoadTests();
  } else if (args.includes('--performance')) {
    await runner.runPerformanceMonitoring();
  } else if (args.includes('--all')) {
    await runner.runAllTests();
  } else {
    console.log('🎯 Scalability Test Runner');
    console.log('=' .repeat(40));
    console.log('Usage:');
    console.log('  node test-runner.js --quick        # Quick basic test');
    console.log('  node test-runner.js --scalability  # Run scalability tests only');
    console.log('  node test-runner.js --load         # Run load tests only');
    console.log('  node test-runner.js --performance  # Run performance monitoring only');
    console.log('  node test-runner.js --all          # Run all tests (recommended)');
    console.log('\nMake sure your backend server is running on http://localhost:5000');
  }
}

// Export for use in other files
module.exports = {
  ScalabilityTestRunner,
  main
};

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 