const Queue = require("../models/Queue");
const cron = require('node-cron'); // Install: npm install node-cron

/**
 * Schedule automatic cleanup of expired queue items
 * Runs every hour to check and expire queue items older than 24 hours
 */
const scheduleQueueCleanup = () => {
  // Run every hour at minute 0
  // Cron format: minute hour day month weekday
  cron.schedule('0 * * * *', async () => {
    try {
      console.log(`[${new Date().toISOString()}] Running queue cleanup job...`);
      
      const expiredCount = await Queue.autoExpireOldQueue();
      
      if (expiredCount > 0) {
        console.log(`✓ Expired ${expiredCount} old queue items`);
      } else {
        console.log('✓ No queue items to expire');
      }
    } catch (error) {
      console.error('❌ Queue cleanup job failed:', error);
    }
  });

  console.log('✓ Queue cleanup job scheduled (runs every hour)');
};

/**
 * Run cleanup immediately (useful for testing or manual triggers)
 */
const runCleanupNow = async () => {
  try {
    console.log('Running immediate queue cleanup...');
    const expiredCount = await Queue.autoExpireOldQueue();
    console.log(`✓ Expired ${expiredCount} queue items`);
    return { success: true, expiredCount };
  } catch (error) {
    console.error('❌ Immediate cleanup failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get statistics about queue expiration
 */
const getQueueStats = async () => {
  const db = require("../config/dbconfig");
  
  try {
    // Get counts by status
    const [statusCounts] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(CASE WHEN created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as old_count
      FROM queue
      WHERE DATE(created_at) = CURDATE()
      GROUP BY status
    `);

    // Get expiring soon count
    const [expiringSoon] = await db.query(`
      SELECT COUNT(*) as count
      FROM queue
      WHERE status IN ('waiting', 'in_progress')
        AND created_at BETWEEN DATE_SUB(NOW(), INTERVAL 24 HOUR) AND DATE_SUB(NOW(), INTERVAL 22 HOUR)
    `);

    return {
      success: true,
      statusCounts,
      expiringSoon: expiringSoon[0].count
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  scheduleQueueCleanup,
  runCleanupNow,
  getQueueStats
};