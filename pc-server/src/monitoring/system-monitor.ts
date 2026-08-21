/**
 * System Monitoring Module
 * Tracks CPU, GPU, RAM, and network performance
 * Critical for maintaining low-latency streaming on i3-6006U
 */

import os from 'os';
import { EventEmitter } from 'events';

export interface SystemStats {
  cpu: {
    usage: number; // Percentage
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    usagePercent: number;
  };
  gpu: {
    usage?: number;
    memoryUsed?: number;
  };
  network: {
    latency: number; // ms
    packetLoss: number; // %
    bandwidth: number; // kbps
  };
  fps: number;
  encoder: {
    bitrate: number;
    loadPercent: number;
  };
}

export class SystemMonitor extends EventEmitter {
  private stats: SystemStats = {
    cpu: { usage: 0 },
    memory: { total: 0, used: 0, usagePercent: 0 },
    gpu: {},
    network: { latency: 0, packetLoss: 0, bandwidth: 0 },
    fps: 0,
    encoder: { bitrate: 4000, loadPercent: 0 },
  };

  private monitorInterval: NodeJS.Timer | null = null;
  private lastCPUCheck = 0;
  private frameCount = 0;
  private lastFrameTime = Date.now();

  start() {
    console.log('System monitoring started');

    this.monitorInterval = setInterval(() => {
      this.updateStats();
    }, 1000); // Update every second
  }

  private updateStats() {
    // CPU Usage (simplified)
    const cpus = os.cpus();
    let totalIdle = 0,
      totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~((idle / total) * 100);
    this.stats.cpu.usage = usage;

    // Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    this.stats.memory = {
      total: totalMem,
      used: usedMem,
      usagePercent: (usedMem / totalMem) * 100,
    };

    // FPS calculation
    this.frameCount++;
    const now = Date.now();
    if (now - this.lastFrameTime >= 1000) {
      this.stats.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    // Warn if resources are constrained (i3-6006U only has 2 cores)
    if (this.stats.cpu.usage > 85) {
      this.emit('warning', {
        type: 'cpu-high',
        usage: this.stats.cpu.usage,
        message: 'CPU usage high - reduce resolution or bitrate',
      });
    }

    if (this.stats.memory.usagePercent > 80) {
      this.emit('warning', {
        type: 'memory-high',
        usage: this.stats.memory.usagePercent,
        message: 'Memory usage high - close background apps',
      });
    }
  }

  getCPUUsage(): number {
    return this.stats.cpu.usage;
  }

  getMemoryUsage(): number {
    return this.stats.memory.usagePercent;
  }

  getGPUUsage(): number | undefined {
    return this.stats.gpu.usage;
  }

  getCurrentFPS(): number {
    return this.stats.fps;
  }

  getCurrentBitrate(): number {
    return this.stats.encoder.bitrate;
  }

  getCurrentLatency(): number {
    return this.stats.network.latency;
  }

  getFullStats(): SystemStats {
    return JSON.parse(JSON.stringify(this.stats));
  }

  recordFrame() {
    this.frameCount++;
  }

  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    console.log('System monitoring stopped');
  }
}
