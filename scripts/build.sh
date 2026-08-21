#!/bin/bash

# Build script for quest-pcvr-streamer
# Supports Windows (via WSL/MinGW) and Linux

set -e

echo "🔨 Building Quest PCVR Streamer..."

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="windows"
else
    OS="unknown"
fi

echo "📱 Detected OS: $OS"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build PC Server
echo "🖥️  Building PC Server..."
cd pc-server
npm install
npm run build
cd ..

# Build WebRTC Signaling Server (if exists)
if [ -d "webrtc-signaling" ]; then
    echo "🔗 Building WebRTC Signaling Server..."
    cd webrtc-signaling
    npm install
    npm run build
    cd ..
fi

# Build Quest Client (requires Android SDK)
if [ -d "quest-client" ]; then
    echo "📱 Building Quest Client APK..."
    cd quest-client
    if [ "$OS" == "windows" ]; then
        echo "⚠️  Windows detected - build Quest Client on Windows/Mac with Gradle"
    else
        npm install
        # gradle build would go here if configured
    fi
    cd ..
fi

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "1. Start WebRTC signaling: cd webrtc-signaling && npm start"
echo "2. Start PC server: cd pc-server && npm start"
echo "3. Install Quest APK and launch"
