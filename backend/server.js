const express = require("express");
const path = require('path');
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./config/dbconfig.js");
const { corsOptions } = require("./config/cors.js");
const userRoutes = require("./routes/userRoutes.js");
const patientRoutes = require("./routes/patientRoutes.js");
const queueRoutes = require("./routes/queueRoutes.js");
const medicineRoutes = require("./routes/medicineRoutes.js");
const equipmentRoutes = require("./routes/equipmentRoutes.js");
const prescriptionRoutes = require("./routes/prescriptionRoutes.js");
const labRoutes = require("./routes/labRoutes.js");
const radiologyRoutes = require("./routes/radiologyRoutes");
const billRoutes = require("./routes/billRoutes.js")
const adminRoutes = require("./routes/adminRoutes.js");
const inventoryRoutes = require("./routes/InventoryRoutes.js");
const salesRoutes = require("./routes/salesRoutes.js");
const referralRoutes = require("./routes/referralRoutes.js");
const ambulanceRoutes = require("./routes/ambulanceRoutes.js");
const settingsRoute = require("./routes/settingRoutes.js");
const expenseRoutes = require("./routes/expenseRoutes.js");

// Chronic Care Module Routes
const chronicRoutes = require("./routes/chronicRoutes.js");
const clinicVisitRoutes = require("./routes/clinicVisitRoutes.js");
const followUpRoutes = require("./routes/followUpRoutes.js");

// M-Pesa Integration
const mpesaRoutes = require("./routes/mpesaRoutes.js");

// Audit Trail & Cashier Shift Routes
const auditRoutes = require("./routes/auditRoutes.js");
const cashierShiftRoutes = require("./routes/cashierShiftRoutes.js");

// Insurance/NHIF/SHA Routes
const insuranceRoutes = require("./routes/insuranceRoutes.js");

// Diagnosis Codes Routes
const diagnosisRoutes = require("./routes/diagnosisRoutes.js");

// Setup & Module Configuration Routes
const setupRoutes = require("./routes/setupRoutes.js");

// Sync Routes
const syncRoutes = require("./routes/syncRoutes.js");

// Super Admin Platform Routes
const superadminRoutes = require("./routes/superadminRoutes.js");

// Module models for initialization
const ModuleConfig = require("./models/ModuleConfig.js");
const HospitalConfig = require("./models/HospitalConfig.js");
const { RadiologyOrder, RadiologyExam } = require("./models/RadiologyOrder.js");

// Sync models and engine
const { SyncQueue, SyncMetadata, SyncConflict } = require("./models/SyncQueue.js");
const { syncEngine } = require("./services/SyncEngine.js");

// Module access middleware
const { loadModuleInfo } = require("./middleware/moduleAccess.js");

const { scheduleQueueCleanup, runCleanupNow, getQueueStats } = require('./utils/queueCleanup');
const { scheduleKeepAlive, pingNow } = require('./utils/serverKeepAlive');

dotenv.config();

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Apply module info middleware globally before route handlers
app.use(loadModuleInfo);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/radiology", radiologyRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/referrals", referralRoutes);
app.use("/api/ambulance", ambulanceRoutes);
app.use("/api/settings", settingsRoute);
app.use("/api/expenses", expenseRoutes);
// Chronic Care Module Routes
app.use("/api/chronic", chronicRoutes);
app.use("/api/clinic-visits", clinicVisitRoutes);
app.use("/api/follow-ups", followUpRoutes);

// M-Pesa Routes
app.use("/api/mpesa", mpesaRoutes);

// Audit Trail & Cashier Shift Routes
app.use("/api/audit", auditRoutes);
app.use("/api/cashier", cashierShiftRoutes);

// Insurance/NHIF/SHA Routes
app.use("/api/insurance", insuranceRoutes);

// Diagnosis Codes Routes
app.use("/api/diagnoses", diagnosisRoutes);

// Setup & Module Configuration Routes
app.use("/api/setup", setupRoutes);

// Sync Routes
app.use("/api/sync", syncRoutes);

// Super Admin Platform Routes (includes public hospital branding endpoint)
app.use("/api/superadmin", superadminRoutes);
app.use("/internal/management", require('./routes/internalManagementRoutes'));


app.get("/", (req, res) => {
  res.send("🚀 Server is running...");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 5500;

app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);

  // Initialize module configuration
  console.log('🔧 Initializing module configuration...');
  try {
    await ModuleConfig.initializeDefaults();
    console.log('✓ Module configuration initialized');

    // Initialize radiology exams
    await RadiologyExam.initializeDefaults();
    console.log('✓ Radiology examinations initialized');

    // Initialize sync engine
    await syncEngine.initialize();
    console.log('✓ Sync engine initialized');
  } catch (err) {
    console.error('❌ Module initialization failed:', err.message);
  }

  // Initialize queue cleanup job
  console.log('🔄 Initializing queue cleanup system...');
  scheduleQueueCleanup();

  // Run initial cleanup on server start
  runCleanupNow().then(result => {
    if (result.success) {
      console.log(`✓ Initial cleanup completed: ${result.expiredCount} items expired`);
    }
  }).catch(err => {
    console.error('❌ Initial cleanup failed:', err.message);
  });

  // Initialize keep-alive system
  console.log('🔄 Initializing server keep-alive system...');
  scheduleKeepAlive();

  // Run initial ping after 30 seconds
  setTimeout(async () => {
    try {
      await pingNow();
    } catch (err) {
      console.error('❌ Initial keep-alive ping failed:', err.message);
    }
  }, 30000);
});
