import { EventEmitter } from 'events';

class WebRTCStreamer extends EventEmitter {
  constructor() {
    super();
    this.peers = new Map();
  }

  async handleOffer(peerId, offer) {
    console.log(`Handling offer from ${peerId}`);
    const answer = {
      type: 'answer',
      sdp: 'v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\n'
    };
    this.peers.set(peerId, { offer, answer });
    return answer;
  }

  addIceCandidate(peerId, candidate) {
    console.log(`ICE candidate for ${peerId}`);
  }

  closePeer(peerId) {
    this.peers.delete(peerId);
  }

  async start() {
    console.log('WebRTC streamer started');
  }

  async stop() {
    console.log('WebRTC streamer stopped');
  }
}

export default WebRTCStreamer;
