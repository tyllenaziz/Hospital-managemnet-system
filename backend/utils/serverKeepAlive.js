const cron = require('node-cron');
const https = require('https');
const http = require('http');

/**
 * Keep-Alive Utility for Render Free Tier
 * Pings the server every 10 minutes to prevent it from spinning down
 */

const SERVER_URL = 'https://bensmma.onrender.com';
const PING_INTERVAL = '*/5 * * * *'; // Every 10 minutes

/**
 * Pings the server health endpoint
 */
const pingServer = () => {
  const url = new URL(`${SERVER_URL}/api/health`);
  const protocol = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = protocol.get(url.href, (res) => {
      const duration = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✓ Keep-alive ping successful (${duration}ms) - ${new Date().toISOString()}`);
          resolve({ success: true, duration, status: res.statusCode });
        } else {
          console.warn(`⚠ Keep-alive ping returned status ${res.statusCode}`);
          resolve({ success: false, status: res.statusCode });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Keep-alive ping failed: ${err.message}`);
      reject(err);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Keep-alive ping timeout'));
    });
  });
};

/**
 * Schedules the keep-alive cron job
 */
const scheduleKeepAlive = () => {
  // Only run in production environment
  if (process.env.NODE_ENV !== 'production') {
    console.log('ℹ Keep-alive cron job disabled in non-production environment');
    return null;
  }

  if (!process.env.SERVER_URL) {
    console.warn('⚠ SERVER_URL not set. Keep-alive functionality may not work correctly.');
  }

  console.log(`🔄 Keep-alive cron job scheduled (every 10 minutes)`);
  console.log(`📍 Target URL: ${SERVER_URL}/api/health`);

  const job = cron.schedule(PING_INTERVAL, async () => {
    try {
      await pingServer();
    } catch (err) {
      console.error('Keep-alive error:', err.message);
    }
  });

  return job;
};

/**
 * Performs an immediate keep-alive ping
 */
const pingNow = async () => {
  try {
    const result = await pingServer();
    return result;
  } catch (err) {
    console.error('Immediate ping failed:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  scheduleKeepAlive,
  pingNow
};