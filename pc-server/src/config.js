class Config {
  constructor() {
    this.data = {
      stream: {
        resolution: '1080p',
        frameRate: 60,
        bitrate: 4000
      },
      server: {
        port: 8080
      }
    };
  }

  get(key, defaultValue) {
    const keys = key.split('.');
    let val = this.data;
    for (const k of keys) {
      val = val?.[k];
    }
    return val !== undefined ? val : defaultValue;
  }

  set(key, value) {
    const keys = key.split('.');
    let obj = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
  }
}

export default Config;
