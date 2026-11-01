# Queue 24-Hour Expiration System - Installation Guide

## Step 1: Install node-cron Package

```bash
npm install node-cron
```

## Step 2: Run Database Migration

Execute the migration SQL to add indexes and stored procedures:

```bash
mysql -u root -p bensmma < migration_queue_24h.sql
```

Or manually run the SQL commands in your MySQL client.

## Step 3: Create the queueCleanup.js File

Create the file: `utils/queueCleanup.js` and add the code from the artifact.

## Step 4: Update Your Files

1. **Update Queue Model** (`models/Queue.js`)
   - Replace with the enhanced version that includes 24-hour filtering
   - Adds `autoExpireOldQueue()` and `getExpiringQueue()` methods

2. **Update Queue Controller** (`controllers/queueController.js`)
   - Replace with enhanced version with better error handling
   - Adds validation and 24-hour awareness

3. **Update Queue Routes** (`routes/queueRoutes.js`)
   - Add the cleanup and stats endpoints

4. **Update server.js**
   - Add the queue cleanup initialization code

5. **Update Patient Controller** (`controllers/patientController.js`)
   - Use the enhanced version with duplicate checking

6. **Update Patient Model** (`models/Patient.js`)
   - Add `findByIdNumber()` and `findByPhone()` methods

7. **Update Frontend Components**
   - Replace `ReceptionDashboard.jsx` with the fixed version
   - Replace `QueueManagement.jsx` with the enhanced version
   - Add `RegisterPatient.jsx` with duplicate detection

## Step 5: Verify Setup

1. Start your server:
```bash
npm start
```

2. Check console for:
```
✅ Server running on port 5500
🔄 Initializing queue cleanup system...
✓ Queue cleanup job scheduled (runs every hour)
✓ Initial cleanup completed: X items expired
```

## Step 6: Enable MySQL Event Scheduler (Optional)

For automatic database-level cleanup:

```sql
SET GLOBAL event_scheduler = ON;
```

Add to your MySQL config file to make it permanent:
```
[mysqld]
event_scheduler=ON
```

## Features Implemented

✅ 24-hour queue expiration
✅ Automatic hourly cleanup
✅ Visual time remaining indicators
✅ Urgent queue item highlighting
✅ Manual cleanup option for admins
✅ Queue statistics tracking
✅ Duplicate patient detection
✅ Comprehensive error handling
✅ Database constraint fixes for user deletion

## Testing

1. Register a new patient
2. Check the queue management page
3. Verify time remaining is displayed
4. Wait for auto-refresh (2 minutes)
5. Test admin cleanup button (if admin user)

## Troubleshooting

**Issue**: Cleanup not running
- Check if node-cron is installed
- Verify server logs for errors
- Check MySQL event_scheduler status

**Issue**: Database foreign key errors
- Run the migration script for `ON DELETE SET NULL`
- Verify all foreign keys are updated

**Issue**: Frontend not showing queue
- Check API responses in browser DevTools
- Verify authenticatedFetch is working
- Check CORS configuration