/**
 * Screen Capture Module
 * Captures desktop frames for streaming
 */

import { EventEmitter } from 'events';
import { Config } from '../config/config';

export interface Frame {
  data: Buffer;
  width: number;
  height: number;
  timestamp: number;
  format: 'RGBA' | 'NV12';
}

export class ScreenCapture extends EventEmitter {
  private config: Config;
  private isCapturing = false;
  private captureInterval: NodeJS.Timer | null = null;
  private frameBuffer: Frame[] = [];
  private maxBufferSize = 3; // Keep last 3 frames

  constructor(config: Config) {
    super();
    this.config = config;
  }

  async start() {
    if (this.isCapturing) return;
    this.isCapturing = true;

    console.log('Screen capture started');

    // Frame capture loop - optimized for i3-6006U
    this.captureInterval = setInterval(() => {
      this.captureFrame();
    }, 1000 / 60); // 60 FPS
  }

  private captureFrame() {
    try {
      // This is a placeholder - actual implementation requires native module
      // Using node-dxgi for Windows or X11 for Linux
      const frame: Frame = {
        data: Buffer.alloc(1920 * 1080 * 4), // 1080p RGBA placeholder
        width: 1920,
        height: 1080,
        timestamp: Date.now(),
        format: 'RGBA',
      };

      this.frameBuffer.push(frame);
      if (this.frameBuffer.length > this.maxBufferSize) {
        this.frameBuffer.shift();
      }

      this.emit('frame', frame);
    } catch (error) {
      console.error('Frame capture error:', error);
      this.emit('error', error);
    }
  }

  getLatestFrame(): Frame | null {
    return this.frameBuffer.length > 0 ? this.frameBuffer[this.frameBuffer.length - 1] : null;
  }

  async stop() {
    this.isCapturing = false;
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    this.frameBuffer = [];
    console.log('Screen capture stopped');
  }
}
