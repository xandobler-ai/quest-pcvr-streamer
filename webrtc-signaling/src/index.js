import express from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';

class SignalingServer {
  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.wsServer = new WebSocket.Server({ server: this.httpServer });
    this.peers = new Map();
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wsServer.on('connection', (ws) => {
      let peerId = null;

      ws.on('message', (data) => {
        const msg = JSON.parse(data);

        if (msg.type === 'register') {
          peerId = msg.peerId;
          this.peers.set(peerId, ws);
          ws.send(JSON.stringify({ type: 'registered', peerId }));
        } else if (msg.type === 'offer' || msg.type === 'answer') {
          const target = this.peers.get(msg.to);
          if (target) {
            target.send(JSON.stringify({ ...msg, from: peerId }));
          }
        }
      });

      ws.on('close', () => {
        if (peerId) this.peers.delete(peerId);
      });
    });
  }

  start(port = 8090) {
    this.httpServer.listen(port, () => {
      console.log(`🔗 Signaling server on ws://localhost:${port}`);
    });
  }
}

const server = new SignalingServer();
server.start();
