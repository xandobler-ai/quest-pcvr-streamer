import { EventEmitter } from 'events';

class ScreenCapture extends EventEmitter {
  constructor() {
    super();
    this.isCapturing = false;
    this.frames = [];
  }

  async start() {
    this.isCapturing = true;
    console.log('Screen capture started');
    
    setInterval(() => {
      if (this.isCapturing) {
        const frame = {
          data: Buffer.alloc(1920 * 1080 * 4),
          width: 1920,
          height: 1080,
          timestamp: Date.now()
        };
        this.frames.push(frame);
        this.emit('frame', frame);
      }
    }, 1000 / 60);
  }

  async stop() {
    this.isCapturing = false;
    this.frames = [];
    console.log('Screen capture stopped');
  }
}

export default ScreenCapture;
