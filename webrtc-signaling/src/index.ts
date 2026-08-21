/**
 * WebRTC Signaling Server
 * Coordinates connection establishment between PC and Quest
 */

import express, { Express, Request, Response } from 'express';
import WebSocket from 'ws';
import { createServer } from 'http';
import path from 'path';

interface Peer {
  id: string;
  type: 'pc' | 'quest';
  ws: WebSocket;
  connectedTo?: string;
  createdAt: number;
}

class SignalingServer {
  private app: Express;
  private httpServer: ReturnType<typeof createServer>;
  private wsServer: WebSocket.Server;
  private peers: Map<string, Peer> = new Map();

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.wsServer = new WebSocket.Server({ server: this.httpServer });
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupRoutes() {
    // Health check
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        peers: this.peers.size,
        uptime: process.uptime(),
      });
    });

    // List active peers
    this.app.get('/api/peers', (req: Request, res: Response) => {
      const peerList = Array.from(this.peers.values()).map((p) => ({
        id: p.id,
        type: p.type,
        connectedTo: p.connectedTo,
        uptime: Date.now() - p.createdAt,
      }));

      res.json(peerList);
    });
  }

  private setupWebSocket() {
    this.wsServer.on('connection', (ws: WebSocket, req) => {
      const clientIp = req.socket.remoteAddress;
      console.log(`New connection from ${clientIp}`);

      let peerId: string | null = null;

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);

          switch (message.type) {
            case 'register':
              peerId = message.peerId;
              const peer: Peer = {
                id: peerId,
                type: message.peerType,
                ws,
                createdAt: Date.now(),
              };

              this.peers.set(peerId, peer);
              console.log(`Peer registered: ${peerId} (${message.peerType})`);

              ws.send(
                JSON.stringify({
                  type: 'registered',
                  peerId,
                })
              );

              break;

            case 'offer':
              this.forwardMessage(message.to, {
                type: 'offer',
                from: peerId,
                offer: message.offer,
              });
              break;

            case 'answer':
              this.forwardMessage(message.to, {
                type: 'answer',
                from: peerId,
                answer: message.answer,
              });

              // Mark peers as connected
              const peer1 = this.peers.get(peerId);
              const peer2 = this.peers.get(message.to);
              if (peer1) peer1.connectedTo = message.to;
              if (peer2) peer2.connectedTo = peerId;

              break;

            case 'ice-candidate':
              this.forwardMessage(message.to, {
                type: 'ice-candidate',
                from: peerId,
                candidate: message.candidate,
              });
              break;

            case 'disconnect':
              if (peerId) {
                const peer = this.peers.get(peerId);
                if (peer?.connectedTo) {
                  this.forwardMessage(peer.connectedTo, {
                    type: 'peer-disconnected',
                  });
                }
              }
              break;

            default:
              console.warn(`Unknown message type: ${message.type}`);
          }
        } catch (error) {
          console.error('Message processing error:', error);
        }
      });

      ws.on('close', () => {
        if (peerId) {
          const peer = this.peers.get(peerId);
          if (peer?.connectedTo) {
            this.forwardMessage(peer.connectedTo, {
              type: 'peer-disconnected',
            });
          }
          this.peers.delete(peerId);
          console.log(`Peer disconnected: ${peerId}`);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private forwardMessage(targetId: string, message: any) {
    const targetPeer = this.peers.get(targetId);
    if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
      targetPeer.ws.send(JSON.stringify(message));
    } else {
      console.warn(`Target peer not found or closed: ${targetId}`);
    }
  }

  start(port: number = 8090) {
    this.httpServer.listen(port, () => {
      console.log(`🔗 WebRTC Signaling Server running on ws://localhost:${port}`);
    });
  }
}

const server = new SignalingServer();
server.start(parseInt(process.env.SIGNALING_PORT || '8090'));
