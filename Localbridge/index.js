const express = require('express');
const cors = require('cors');
const ZKLib = require('node-zklib');

const app = express();
const PORT = 3300;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for device IP
let deviceConfig = {
  ip: '192.168.1.115',
  port: 4370
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Local ZKTeco Bridge is running',
    timestamp: new Date().toISOString()
  });
});

// Test connection endpoint
app.post('/api/test-connection', async (req, res) => {
  const { ip, port } = req.body;
  
  if (!ip) {
    return res.status(400).json({
      success: false,
      message: 'IP address is required'
    });
  }

  const zkInstance = new ZKLib(ip, port || 4370, 10000, 4000);
  
  try {
    await zkInstance.createSocket();
    
    // Try to fetch users to verify connection
    const userResponse = await zkInstance.getUsers();
    const users = Array.isArray(userResponse) ? userResponse : userResponse?.data || [];
    
    await zkInstance.disconnect();
    
    // Save the IP if connection is successful
    deviceConfig.ip = ip;
    deviceConfig.port = port || 4370;
    
    res.json({
      success: true,
      message: 'Connection successful',
      userCount: users.length
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to device',
      error: error.message
    });
  }
});

// Get attendance endpoint
app.post('/api/attendance', async (req, res) => {
  const { ip, port, date } = req.body;
  
  const deviceIP = ip || deviceConfig.ip;
  const devicePort = port || deviceConfig.port;
  
  if (!deviceIP) {
    return res.status(400).json({
      success: false,
      message: 'Device IP not configured'
    });
  }

  const zkInstance = new ZKLib(deviceIP, devicePort, 10000, 4000);
  
  try {
    await zkInstance.createSocket();
    
    // Fetch attendance and user data
    const attendanceResponse = await zkInstance.getAttendances();
    const userResponse = await zkInstance.getUsers();
    
    // Normalize both responses to arrays
    const logs = Array.isArray(attendanceResponse)
      ? attendanceResponse
      : attendanceResponse?.data || [];
    const users = Array.isArray(userResponse)
      ? userResponse
      : userResponse?.data || [];
    
    // Filter logs by date if provided
    let filteredLogs = logs;
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      filteredLogs = logs.filter(log => {
        const logTime = new Date(log.recordTime);
        return logTime >= startOfDay && logTime <= endOfDay;
      });
    }
    
    // Combine with user data
    const detailedLogs = filteredLogs.map(log => {
      const user = users.find(u => u.userId === log.deviceUserId);
      return {
        userSn: log.userSn,
        deviceUserId: log.deviceUserId,
        recordTime: log.recordTime,
        name: user ? user.name : 'Unknown User',
      };
    });
    
    await zkInstance.disconnect();
    
    res.json({
      success: true,
      count: detailedLogs.length,
      data: detailedLogs,
      date: date || 'all'
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance data',
      error: error.message
    });
  }
});

// Get all users from device
app.post('/api/users', async (req, res) => {
  const { ip, port } = req.body;
  
  const deviceIP = ip || deviceConfig.ip;
  const devicePort = port || deviceConfig.port;
  
  if (!deviceIP) {
    return res.status(400).json({
      success: false,
      message: 'Device IP not configured'
    });
  }

  const zkInstance = new ZKLib(deviceIP, devicePort, 10000, 4000);
  
  try {
    await zkInstance.createSocket();
    
    const userResponse = await zkInstance.getUsers();
    const users = Array.isArray(userResponse) ? userResponse : userResponse?.data || [];
    
    await zkInstance.disconnect();
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get current device configuration
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    config: deviceConfig
  });
});

// Update device configuration
app.post('/api/config', (req, res) => {
  const { ip, port } = req.body;
  
  if (ip) deviceConfig.ip = ip;
  if (port) deviceConfig.port = port;
  
  res.json({
    success: true,
    message: 'Configuration updated',
    config: deviceConfig
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        🔌 ZKTeco Local Bridge Server Running 🔌          ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Server is running on: http://localhost:${PORT}`);
  console.log(`📡 Device IP configured: ${deviceConfig.ip}:${deviceConfig.port}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  /api/health           - Check server status`);
  console.log(`  POST /api/test-connection  - Test device connection`);
  console.log(`  POST /api/attendance       - Fetch attendance records`);
  console.log(`  POST /api/users            - Fetch all users from device`);
  console.log(`  GET  /api/config           - Get current configuration`);
  console.log(`  POST /api/config           - Update configuration`);
  console.log('');
  console.log('💡 Configure device IP in the frontend Settings page');
  console.log('═══════════════════════════════════════════════════════════');
});