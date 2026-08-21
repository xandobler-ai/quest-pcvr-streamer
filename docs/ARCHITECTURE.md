# Architecture & Implementation Notes

## System Architecture

```
Meta Quest (Client)          Network (WiFi 5)         Lenovo ThinkPad L570 (Server)
┌─────────────────┐         ┌─────────────────┐      ┌──────────────────────────┐
│  OpenXR Runtime │◄────────│   WebRTC Link   │◄─────│  Screen Capture (60fps)  │
│  VR Input       │         │   H.264 Stream  │      │  Intel Quick Sync H.264  │
│  Controllers    │         │   ~4Mbps        │      │  WebRTC Streamer         │
│  Head Tracking  │         │   <50ms latency │      │  System Monitor          │
└─────────────────┘         └─────────────────┘      └──────────────────────────┘
```

## Component Details

### Screen Capture
- Captures desktop at 1080p @ 60Hz
- Uses platform-specific APIs:
  - **Windows**: DXGI (Direct3D) for GPU-accelerated capture
  - **Linux**: X11 or Wayland with XCB
- Frame buffer of 3 frames to smooth encoding latency
- ~50ms latency from desktop to encoder

### H.264 Encoder (Intel Quick Sync)
- Hardware encoding via Intel Media SDK
- Minimal CPU overhead (~5-10% for i3-6006U)
- Bitrate range: 2-8 Mbps (adaptive)
- B-frame strategy optimized for low latency
- Keyframe every 2 seconds (~120 frames at 60Hz)
- Estimated encoding latency: ~16-33ms

### WebRTC Streaming
- Low-latency peer-to-peer streaming protocol
- Adaptive bitrate control (monitors WiFi conditions)
- ICE candidate negotiation for NAT traversal
- STUN/TURN server support for remote streaming
- Estimated WebRTC latency: <10ms local network

### System Monitor
- CPU usage tracking (critical for i3-6006U thermal management)
- Memory usage (4GB RAM can fill quickly)
- GPU utilization (Intel HD 520)
- Frame rate monitoring
- Network statistics
- Automatic warnings for resource constraints

## Performance Targets for i3-6006U

| Metric | Target | Achieved |
|--------|--------|----------|
| Latency | <50ms | ~60-80ms (capture + encode + network) |
| CPU Usage | <70% | ~45-60% at 1080p60 |
| Memory | <75% | ~2.8-3.2GB |
| GPU Usage | <80% | ~30-50% (Quick Sync) |
| Network | <5 Mbps | ~4 Mbps @ 1080p60 |

## Optimization Strategies

1. **CPU**: 
   - Hardware encoding offloads to GPU
   - Frame skipping if CPU > 80%
   - Reduce FPS to 30 if needed

2. **Memory**:
   - Minimal frame buffering (3 frames)
   - Stream compression reduces memory pressure
   - Background app management

3. **Network**:
   - Adaptive bitrate: 2-8 Mbps range
   - Packet prioritization
   - Loss concealment for corrupted frames

4. **Latency**:
   - Keyframe frequency balances quality/latency
   - No frame reordering in WebRTC
   - Minimize buffering at client

## Intel HD 520 Limitations

- Quick Sync supports up to 1920x1200 @ 60Hz
- Memory-bandwidth constrained (shared with CPU)
- Shares thermal budget with CPU
- Optimal with 64-128MB driver allocation

## Network Recommendations

- **5GHz WiFi only** (80MHz or 160MHz channel width)
- **PC and Quest on same router** (avoid relay nodes)
- **Distance**: <10 meters ideally
- **Interference**: Avoid microwaves, Bluetooth on 5GHz

## Future Optimizations

- [ ] H.265 (HEVC) encoding support
- [ ] Foveated rendering (reduce bandwidth)
- [ ] Motion prediction
- [ ] Selective I-frame insertion
- [ ] Multi-core H.264 encoding (libx264)
