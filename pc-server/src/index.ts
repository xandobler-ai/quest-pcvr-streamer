/**
 * Quest PCVR Streamer - PC Server
 * Main entry point for desktop streaming server
 */

import express, { Express, Request, Response } from 'express';
import WebSocket from 'ws';
import { createServer } from 'http';
import path from 'path';
import os from 'os';

import { ScreenCapture } from './capture/screen-capture';
import { H264Encoder } from './encoder/h264-encoder';
import { WebRTCStreamer } from './streaming/webrtc-streamer';
import { SystemMonitor } from './monitoring/system-monitor';
import { Config } from './config/config';

class PCVRServer {
  private app: Express;
  private httpServer: ReturnType<typeof createServer>;
  private wsServer: WebSocket.Server;
  private screenCapture: ScreenCapture | null = null;
  private encoder: H264Encoder | null = null;
  private webrtc: WebRTCStreamer | null = null;
  private monitor: SystemMonitor;
  private config: Config;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.wsServer = new WebSocket.Server({ server: this.httpServer });
    this.monitor = new SystemMonitor();
    this.config = new Config();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Health check
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        uptime: process.uptime(),
        platform: os.platform(),
        cpu: os.cpus()[0].model,
      });
    });

    // System info
    this.app.get('/api/system', (req: Request, res: Response) => {
      res.json({
        cpuUsage: this.monitor.getCPUUsage(),
        memoryUsage: this.monitor.getMemoryUsage(),
        gpuUsage: this.monitor.getGPUUsage(),
        fps: this.monitor.getCurrentFPS(),
        bitrate: this.monitor.getCurrentBitrate(),
        latency: this.monitor.getCurrentLatency(),
      });
    });

    // Configuration
    this.app.get('/api/config', (req: Request, res: Response) => {
      res.json(this.config.getAll());
    });

    this.app.post('/api/config', express.json(), (req: Request, res: Response) => {
      this.config.update(req.body);
      res.json({ success: true });
    });

    // Serve UI
    this.app.use(express.static(path.join(__dirname, '../ui')));
  }

  async start() {
    const port = this.config.get('serverPort', 8080);

    try {
      // Initialize components
      console.log('Initializing screen capture...');
      this.screenCapture = new ScreenCapture(this.config);

      console.log('Initializing H.264 encoder...');
      this.encoder = new H264Encoder(this.config);

      console.log('Initializing WebRTC streamer...');
      this.webrtc = new WebRTCStreamer(this.config);

      // Setup WebSocket for streaming
      this.wsServer.on('connection', (ws: WebSocket) => {
        console.log('Client connected');
        this.handleClientConnection(ws);
      });

      // Start monitoring
      this.monitor.start();

      // Start server
      this.httpServer.listen(port, () => {
        console.log(`🎮 Quest PCVR Server running on http://localhost:${port}`);
        console.log(`📊 System: ${os.platform()} - ${os.cpus()[0].model}`);
        console.log(`💾 RAM: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private handleClientConnection(ws: WebSocket) {
    let peerId: string | null = null;

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data);

        switch (message.type) {
          case 'register':
            peerId = message.peerId;
            console.log(`Client registered: ${peerId}`);
            ws.send(
              JSON.stringify({
                type: 'registered',
                success: true,
              })
            );
            break;

          case 'start_stream':
            if (peerId && this.webrtc) {
              const offer = message.offer;
              const answer = await this.webrtc.handleOffer(peerId, offer);
              ws.send(
                JSON.stringify({
                  type: 'stream_answer',
                  answer,
                })
              );
            }
            break;

          case 'ice_candidate':
            if (peerId && this.webrtc) {
              this.webrtc.addIceCandidate(peerId, message.candidate);
            }
            break;

          default:
            console.warn(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Processing error',
          })
        );
      }
    });

    ws.on('close', () => {
      console.log(`Client disconnected: ${peerId}`);
      if (peerId && this.webrtc) {
        this.webrtc.closePeer(peerId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  async stop() {
    console.log('Shutting down server...');
    this.monitor.stop();
    this.wsServer.close();
    this.httpServer.close();
    if (this.screenCapture) await this.screenCapture.stop();
    if (this.encoder) await this.encoder.stop();
    if (this.webrtc) await this.webrtc.stop();
  }
}

// Run server
const server = new PCVRServer();
server.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
