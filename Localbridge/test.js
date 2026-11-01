const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());

app.use(cors());


// Load mock attendance data from file
const mockDataPath = path.join(__dirname, 'attendance.json');

let mockAttendanceData = { success: true, data: [] };

try {
  const fileData = fs.readFileSync(mockDataPath, 'utf-8');
  mockAttendanceData = JSON.parse(fileData);
  console.log(`✅ Mock data loaded from ${mockDataPath}`);
} catch (err) {
  console.error('⚠️ Could not load mock data:', err.message);
}

// Mock Attendance Endpoint
app.post('/api/attendance', async (req, res) => {
  const { date } = req.body;

  try {
    // Use mock data
    const logs = mockAttendanceData.data || [];

    // Filter by date if provided
    let filteredLogs = logs;
    if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const filtered = logs.filter(log => {
            const logTime = new Date(log.recordTime);
            return logTime >= startOfDay && logTime <= endOfDay;
        });

        // ✅ If none match, fallback to all logs for testing
        filteredLogs = filtered.length > 0 ? filtered : logs;
        }


    // Map to normalized structure
    const detailedLogs = filteredLogs.map(log => ({
      userSn: log.userSn,
      deviceUserId: log.deviceUserId,
      recordTime: log.recordTime,
      name: log.name || 'Unknown User',
    }));

    // Send mock response
    res.json({
      success: true,
      count: detailedLogs.length,
      date: date || 'all',
      data: detailedLogs,
    });
  } catch (error) {
    console.error('❌ Error fetching mock attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mock attendance data',
      error: error.message,
    });
  }
});

// Start the mock server
const PORT = 3300;
app.listen(PORT, () => {
  console.log(`🚀 Mock Attendance Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: POST http://localhost:${PORT}/api/attendance`);
});
