# Installation Guide

## Prerequisites

### PC Requirements
- Windows 10+ or Linux
- Intel 6th Gen+ CPU with Quick Sync (i3-6006U compatible)
- 4GB RAM minimum
- 5GHz WiFi 5 capable
- 2GB free storage

### Meta Quest Setup
- Meta Quest 2, Quest 3, or Quest Pro
- Developer mode enabled
- WiFi 5 capable network

## PC Server Setup

### Windows

1. **Install Visual Studio Build Tools** (C++ support)
   ```bash
   # Download from https://visualstudio.microsoft.com/downloads/
   # Select "Desktop development with C++"
   ```

2. **Install Intel Media SDK**
   ```bash
   # Download from https://github.com/Intel-Media-SDK/MediaSDK/releases
   # Required for Quick Sync H.264 encoding
   ```

3. **Install Node.js** (v16+)
   ```bash
   choco install nodejs  # or download from nodejs.org
   ```

4. **Clone and Setup**
   ```bash
   git clone https://github.com/xandobler-ai/quest-pcvr-streamer.git
   cd quest-pcvr-streamer
   npm install
   ```

5. **Build Encoder Module**
   ```bash
   cd encoder
   npm run build:windows
   ```

6. **Start Server**
   ```bash
   npm run start:server
   ```

### Linux

1. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install -y build-essential cmake git nodejs npm
   sudo apt install -y libva-dev libva-x11-dev  # Intel Media SDK deps
   ```

2. **Build and Run**
   ```bash
   git clone https://github.com/xandobler-ai/quest-pcvr-streamer.git
   cd quest-pcvr-streamer
   npm install
   npm run build
   npm run start:server
   ```

## Meta Quest Client Setup

1. **Enable Developer Mode**
   - Open Meta Quest app on phone
   - Settings → Apps & Games → Unknown Sources → Enable

2. **Install APK**
   ```bash
   adb connect <quest-ip-address>
   adb install quest-client/build/quest-pcvr-streamer.apk
   ```

3. **Launch App**
   - On Quest headset, find "Unknown Sources"
   - Select "PCVR Streamer"

## Network Configuration

### Optimal WiFi Settings
- **Band**: 5GHz (802.11ac)
- **Channel**: 36, 40, 44, 48, 149, 153, 157, 161, 165
- **Bandwidth**: 80MHz or 160MHz
- **Security**: WPA2/WPA3

### Firewall Rules
- Open UDP ports 3478-3479 (STUN)
- Open TCP ports 8080-8090 (WebRTC signaling)

## Troubleshooting

### "Intel Quick Sync not detected"
- Update GPU drivers: https://www.intel.com/content/www/us/en/support/detect.html
- Verify HD 520 support: Should show in Device Manager > Display Adapters

### High Latency (>100ms)
- Check WiFi signal strength (aim for -50dBm or better)
- Reduce resolution to 720p
- Disable other network devices
- Check CPU/GPU usage (should be <80%)

### Connection Drops
- Ensure 5GHz WiFi is stable
- Move closer to router
- Check for interference (microwave, Bluetooth)
- Verify port forwarding if remote streaming

## Default URLs

- **PC Server**: http://localhost:8080
- **WebRTC Signaling**: ws://localhost:8090

## Performance Tips

For i3-6006U with HD 520:
- Start at 1080p @ 60Hz, 4Mbps bitrate
- Reduce to 720p if latency increases
- Enable adaptive bitrate (auto-adjusts to WiFi conditions)
- Close background apps to free RAM

See [OPTIMIZATION.md](./OPTIMIZATION.md) for advanced tuning.
