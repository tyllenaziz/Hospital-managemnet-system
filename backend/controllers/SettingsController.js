const Bill = require("../models/Bill");

const settingsController = {
  // Get all settings
  getSettings: async (req, res) => {
    try {
      const settings = await Bill.getSettings(req.user?.hospital_id || null);
      res.json({
        success: true,
        settings
      });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch settings" 
      });
    }
  },

  // Update settings
  updateSettings: async (req, res) => {
    try {
      const { consultation_fee } = req.body;

      // Validate consultation fee
      if (consultation_fee === undefined || consultation_fee === null) {
        return res.status(400).json({ 
          success: false,
          error: "Consultation fee is required" 
        });
      }

      const fee = parseFloat(consultation_fee);
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ 
          success: false,
          error: "Consultation fee must be a valid positive number" 
        });
      }

      await Bill.updateSettings({ consultation_fee: fee }, req.user?.hospital_id || null);

      res.json({
        success: true,
        message: "Settings updated successfully",
        settings: {
          consultation_fee: fee
        }
      });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to update settings" 
      });
    }
  }
};

module.exports = settingsController;