// backend/services/cache.js
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 60 * 60 * 6, checkperiod: 120 }); // 6h TTL by default

// Optional Redis stub - uncomment and configure if you use Redis in production
// const Redis = require("ioredis");
// const redis = new Redis(process.env.REDIS_URL);

module.exports = {
  get: (key) => {
    // try NodeCache first
    return cache.get(key);
  },
  set: (key, value, ttlSeconds) => {
    return cache.set(key, value, ttlSeconds || 0);
  },
  del: (key) => cache.del(key),
  flush: () => cache.flushAll()
};
