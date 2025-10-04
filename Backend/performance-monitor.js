const os = require('os');
const { performance } = require('perf_hooks');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      network: [],
      timestamps: [],
      events: []
    };
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.startTime = null;
  }

  start() {
    if (this.isMonitoring) {
      console.log('⚠️  Performance monitoring is already running');
      return;
    }

    console.log('🔍 Starting performance monitoring...');
    this.isMonitoring = true;
    this.startTime = performance.now();
    
    // Monitor every 1 second
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
    }, 1000);
  }

  stop() {
    if (!this.isMonitoring) {
      console.log('⚠️  Performance monitoring is not running');
      return;
    }

    console.log('🛑 Stopping performance monitoring...');
    this.isMonitoring = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  collectMetrics() {
    const timestamp = performance.now();
    
    // CPU Usage
    const cpuUsage = os.loadavg();
    const cpuPercent = (cpuUsage[0] / os.cpus().length) * 100;
    
    // Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryPercent = (usedMem / totalMem) * 100;
    
    // Process Memory
    const processMemory = process.memoryUsage();
    
    // Network Interfaces
    const networkInterfaces = os.networkInterfaces();
    let networkData = {};
    
    Object.keys(networkInterfaces).forEach(interfaceName => {
      const interfaces = networkInterfaces[interfaceName];
      interfaces.forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          networkData[interfaceName] = {
            address: iface.address,
            netmask: iface.netmask,
            mac: iface.mac
          };
        }
      });
    });
    
    const metric = {
      timestamp,
      cpu: {
        loadAverage: cpuUsage,
        usagePercent: cpuPercent,
        cores: os.cpus().length
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usagePercent: memoryPercent,
        process: {
          rss: processMemory.rss,
          heapUsed: processMemory.heapUsed,
          heapTotal: processMemory.heapTotal,
          external: processMemory.external
        }
      },
      network: networkData,
      uptime: os.uptime()
    };
    
    this.metrics.cpu.push(metric.cpu);
    this.metrics.memory.push(metric.memory);
    this.metrics.network.push(metric.network);
    this.metrics.timestamps.push(timestamp);
  }

  addEvent(event) {
    this.metrics.events.push({
      timestamp: performance.now(),
      event
    });
  }

  getCurrentMetrics() {
    if (this.metrics.cpu.length === 0) {
      return null;
    }
    
    const latest = this.metrics.cpu.length - 1;
    return {
      cpu: this.metrics.cpu[latest],
      memory: this.metrics.memory[latest],
      network: this.metrics.network[latest],
      timestamp: this.metrics.timestamps[latest]
    };
  }

  getAverageMetrics() {
    if (this.metrics.cpu.length === 0) {
      return null;
    }
    
    const avgCpu = this.metrics.cpu.reduce((sum, cpu) => sum + cpu.usagePercent, 0) / this.metrics.cpu.length;
    const avgMemory = this.metrics.memory.reduce((sum, mem) => sum + mem.usagePercent, 0) / this.metrics.memory.length;
    
    return {
      avgCpuUsage: avgCpu,
      avgMemoryUsage: avgMemory,
      maxCpuUsage: Math.max(...this.metrics.cpu.map(cpu => cpu.usagePercent)),
      maxMemoryUsage: Math.max(...this.metrics.memory.map(mem => mem.usagePercent)),
      minCpuUsage: Math.min(...this.metrics.cpu.map(cpu => cpu.usagePercent)),
      minMemoryUsage: Math.min(...this.metrics.memory.map(mem => mem.usagePercent))
    };
  }

  generateReport() {
    const totalTime = this.startTime ? performance.now() - this.startTime : 0;
    const avgMetrics = this.getAverageMetrics();
    
    if (!avgMetrics) {
      return { error: 'No metrics collected' };
    }
    
    const report = {
      monitoringDuration: `${(totalTime / 1000).toFixed(2)}s`,
      samplesCollected: this.metrics.cpu.length,
      averageMetrics: avgMetrics,
      systemInfo: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB`,
        cpuCores: os.cpus().length,
        uptime: `${(os.uptime() / 3600).toFixed(2)}h`
      },
      events: this.metrics.events,
      recommendations: this.generateRecommendations(avgMetrics)
    };
    
    return report;
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.avgCpuUsage > 80) {
      recommendations.push('⚠️  High CPU usage detected. Consider optimizing database queries or adding caching.');
    }
    
    if (metrics.avgMemoryUsage > 85) {
      recommendations.push('⚠️  High memory usage detected. Consider implementing memory management or scaling horizontally.');
    }
    
    if (metrics.maxCpuUsage > 95) {
      recommendations.push('🚨 Critical CPU usage detected. Immediate optimization required.');
    }
    
    if (metrics.maxMemoryUsage > 95) {
      recommendations.push('🚨 Critical memory usage detected. Immediate scaling required.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ System performance is within acceptable limits.');
    }
    
    return recommendations;
  }

  printLiveMetrics() {
    if (!this.isMonitoring) {
      console.log('❌ Performance monitoring is not running');
      return;
    }
    
    const current = this.getCurrentMetrics();
    if (!current) {
      console.log('❌ No metrics available');
      return;
    }
    
    console.clear();
    console.log('📊 LIVE PERFORMANCE METRICS');
    console.log('=' .repeat(50));
    console.log(`⏱️  Timestamp: ${new Date().toISOString()}`);
    console.log(`🖥️  CPU Usage: ${current.cpu.usagePercent.toFixed(2)}%`);
    console.log(`💾 Memory Usage: ${current.memory.usagePercent.toFixed(2)}%`);
    console.log(`📦 Process Memory: ${(current.memory.process.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`🔄 Load Average: ${current.cpu.loadAverage.map(load => load.toFixed(2)).join(', ')}`);
    console.log(`⏰ System Uptime: ${(current.uptime / 3600).toFixed(2)}h`);
    
    // Print recent events
    if (this.metrics.events.length > 0) {
      console.log('\n📋 Recent Events:');
      const recentEvents = this.metrics.events.slice(-5);
      recentEvents.forEach(event => {
        const timeAgo = ((performance.now() - event.timestamp) / 1000).toFixed(1);
        console.log(`   ${timeAgo}s ago: ${event.event}`);
      });
    }
  }

  startLiveDisplay() {
    if (this.liveDisplayInterval) {
      clearInterval(this.liveDisplayInterval);
    }
    
    this.liveDisplayInterval = setInterval(() => {
      this.printLiveMetrics();
    }, 2000); // Update every 2 seconds
  }

  stopLiveDisplay() {
    if (this.liveDisplayInterval) {
      clearInterval(this.liveDisplayInterval);
      this.liveDisplayInterval = null;
    }
  }
}

// Create a singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export the singleton and the class
module.exports = {
  performanceMonitor,
  PerformanceMonitor
};

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--start')) {
    performanceMonitor.start();
    
    if (args.includes('--live')) {
      performanceMonitor.startLiveDisplay();
    }
    
    // Stop monitoring after 60 seconds if not running live
    if (!args.includes('--live')) {
      setTimeout(() => {
        performanceMonitor.stop();
        const report = performanceMonitor.generateReport();
        console.log('\n📊 PERFORMANCE REPORT');
        console.log('=' .repeat(50));
        console.log(JSON.stringify(report, null, 2));
        process.exit(0);
      }, 60000);
    }
  } else if (args.includes('--stop')) {
    performanceMonitor.stop();
    performanceMonitor.stopLiveDisplay();
    const report = performanceMonitor.generateReport();
    console.log('\n📊 FINAL PERFORMANCE REPORT');
    console.log('=' .repeat(50));
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } else {
    console.log('Usage:');
    console.log('  node performance-monitor.js --start [--live]  # Start monitoring');
    console.log('  node performance-monitor.js --stop            # Stop monitoring and show report');
  }
} 