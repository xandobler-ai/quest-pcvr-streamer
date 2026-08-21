import express from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';
import path from 'path';
import os from 'os';

class PCVRServer {
  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.wsServer = new WebSocket.Server({ server: this.httpServer });
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', uptime: process.uptime() });
    });

    this.app.get('/api/system', (req, res) => {
      res.json({
        cpuUsage: Math.random() * 100,
        memoryUsage: (os.totalmem() - os.freemem()) / os.totalmem() * 100
      });
    });
  }

  start() {
    const port = 8080;
    this.httpServer.listen(port, () => {
      console.log(`🎮 Server running on http://localhost:${port}`);
    });
  }
}

const server = new PCVRServer();
server.start();
