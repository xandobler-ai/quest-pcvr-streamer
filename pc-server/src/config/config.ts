/**
 * Configuration management for PCVR Server
 * Handles default settings and runtime configuration
 */

interface StreamConfig {
  resolution: '1080p' | '720p' | '480p';
  frameRate: 60 | 30;
  bitrate: number; // kbps
  encodingQuality: 'low' | 'medium' | 'high';
  adaptiveBitrate: boolean;
  minBitrate: number;
  maxBitrate: number;
}

interface ServerConfig {
  serverPort: number;
  signalingServerUrl: string;
  enableVoiceChat: boolean;
  controllerPassthrough: boolean;
  enableNetworkOptimization: boolean;
}

interface HardwareConfig {
  useQuickSync: boolean;
  gpuDevice: number;
  cpuThreads: number;
  enableHardwareDecoding: boolean;
}

export class Config {
  private config: Record<string, any> = {
    // Streaming defaults optimized for i3-6006U + HD 520
    stream: {
      resolution: '1080p',
      frameRate: 60,
      bitrate: 4000, // 4Mbps initial
      encodingQuality: 'medium',
      adaptiveBitrate: true,
      minBitrate: 2000, // 2Mbps floor
      maxBitrate: 8000, // 8Mbps ceiling
    } as StreamConfig,

    // Server defaults
    server: {
      serverPort: 8080,
      signalingServerUrl: 'ws://localhost:8090',
      enableVoiceChat: false,
      controllerPassthrough: true,
      enableNetworkOptimization: true,
    } as ServerConfig,

    // Hardware defaults
    hardware: {
      useQuickSync: true,
      gpuDevice: 0,
      cpuThreads: 2, // Conservative for i3-6006U (2 cores)
      enableHardwareDecoding: true,
    } as HardwareConfig,
  };

  constructor() {
    this.loadFromEnvironment();
  }

  private loadFromEnvironment() {
    // Load overrides from environment variables
    if (process.env.PCVR_RESOLUTION) {
      this.config.stream.resolution = process.env.PCVR_RESOLUTION;
    }
    if (process.env.PCVR_BITRATE) {
      this.config.stream.bitrate = parseInt(process.env.PCVR_BITRATE);
    }
    if (process.env.PCVR_SERVER_PORT) {
      this.config.server.serverPort = parseInt(process.env.PCVR_SERVER_PORT);
    }
    if (process.env.PCVR_USE_QUICKSYNC) {
      this.config.hardware.useQuickSync = process.env.PCVR_USE_QUICKSYNC === 'true';
    }
  }

  get<T>(key: string, defaultValue?: T): T {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      value = value?.[k];
    }

    return value !== undefined ? value : defaultValue;
  }

  set(key: string, value: any) {
    const keys = key.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
  }

  getAll(): Record<string, any> {
    return JSON.parse(JSON.stringify(this.config));
  }

  update(partial: Record<string, any>) {
    this.config = { ...this.config, ...partial };
  }

  // Preset configurations for different scenarios
  static presets = {
    ultraLow: {
      stream: { resolution: '480p', frameRate: 30, bitrate: 2000, encodingQuality: 'low' },
      hardware: { cpuThreads: 1 },
    },
    balanced: {
      stream: { resolution: '720p', frameRate: 60, bitrate: 4000, encodingQuality: 'medium' },
      hardware: { cpuThreads: 2 },
    },
    quality: {
      stream: { resolution: '1080p', frameRate: 60, bitrate: 8000, encodingQuality: 'high' },
      hardware: { cpuThreads: 3 },
    },
  };

  applyPreset(name: keyof typeof Config.presets) {
    const preset = Config.presets[name];
    this.update(preset);
  }
}
