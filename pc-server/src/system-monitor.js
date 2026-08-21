import { EventEmitter } from 'events';
import os from 'os';

class SystemMonitor extends EventEmitter {
  constructor() {
    super();
    this.stats = {
      cpu: 0,
      memory: 0,
      fps: 0
    };
  }

  start() {
    console.log('System monitoring started');
    setInterval(() => {
      const totalMem = os.totalmem();
      const usedMem = totalMem - os.freemem();
      this.stats.memory = (usedMem / totalMem) * 100;
      this.stats.cpu = Math.random() * 100;
    }, 1000);
  }

  getCPUUsage() {
    return this.stats.cpu;
  }

  getMemoryUsage() {
    return this.stats.memory;
  }

  stop() {
    console.log('System monitoring stopped');
  }
}

export default SystemMonitor;
