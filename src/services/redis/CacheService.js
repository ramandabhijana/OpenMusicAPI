const redis = require('redis');
const config = require('../../config');

class CacheService {
  constructor() {
    this._client = redis.createClient({
      socket: {
        host: config.redis.host,
      },
    });

    this._client.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.log(`Redis client error: ${error}`);
    });

    this._client.connect();
  }

  async get(key) {
    const value = await this._client.get(key);
    if (value === null) {
      throw new Error(`Cache dengan key=${key} tidak ditemukan`);
    }
    return value;
  }

  async set(key, value, expiration = 1800) {
    await this._client.set(key, value, { EX: expiration });
  }

  delete(key) {
    return this._client.del(key);
  }
}

module.exports = CacheService;
