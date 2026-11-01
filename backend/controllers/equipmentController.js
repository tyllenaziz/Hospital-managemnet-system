const Equipment = require("../models/Equipment");

const equipmentController = {
  // Get all equipment
  getAll: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const equipment = await Equipment.getAll(hospitalId);

      res.json({
        success: true,
        equipment: equipment || [],
        count: equipment ? equipment.length : 0
      });
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch equipment"
      });
    }
  },

  // Get equipment by ID
  getById: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const equipment = await Equipment.getById(req.params.id, hospitalId);

      if (!equipment) {
        return res.status(404).json({
          success: false,
          error: "Equipment not found"
        });
      }

      res.json({
        success: true,
        equipment
      });
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({
        success: false,
        error: "Database error"
      });
    }
  },

  // Get equipment by serial number
  getBySerialNumber: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const { serial_number } = req.params;
      const equipment = await Equipment.getBySerialNumber(serial_number, hospitalId);

      if (!equipment) {
        return res.json({
          success: true,
          exists: false,
          equipment: null
        });
      }

      res.json({
        success: true,
        exists: true,
        equipment
      });
    } catch (error) {
      console.error('Error fetching equipment by serial number:', error);
      res.status(500).json({
        success: false,
        error: "Database error"
      });
    }
  },

  // Add new equipment to inventory
  create: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const {
        name,
        serial_number,
        purchase_date,
        purchase_price,
        warranty_expiry,
        status,
        location,
        description
      } = req.body;

      if (!name || !serial_number || !purchase_date) {
        return res.status(400).json({
          success: false,
          error: "Name, serial number, and purchase date are required"
        });
      }

      const equipment = await Equipment.create({
        name,
        serial_number,
        purchase_date,
        purchase_price: purchase_price || 0,
        warranty_expiry: warranty_expiry || null,
        status: status || 'active',
        location: location || '',
        description: description || ''
      }, hospitalId);

      res.json({
        success: true,
        message: "Equipment added successfully",
        equipment
      });
    } catch (error) {
      console.error("Equipment creation error:", error);
      res.status(400).json({
        success: false,
        error: "Equipment creation failed",
        details: error.message
      });
    }
  },

  // Update equipment
  update: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const {
        name,
        serial_number,
        purchase_date,
        purchase_price,
        warranty_expiry,
        status,
        location,
        description
      } = req.body;

      if (!name || !serial_number || !purchase_date) {
        return res.status(400).json({
          success: false,
          error: "Name, serial number, and purchase date are required"
        });
      }

      const affectedRows = await Equipment.update(req.params.id, {
        name,
        serial_number,
        purchase_date,
        purchase_price: purchase_price || 0,
        warranty_expiry: warranty_expiry || null,
        status: status || 'active',
        location: location || '',
        description: description || ''
      }, hospitalId);

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Equipment not found"
        });
      }

      res.json({
        success: true,
        message: "Equipment updated successfully"
      });
    } catch (error) {
      console.error('Update error:', error);
      res.status(400).json({
        success: false,
        error: "Update failed",
        details: error.message
      });
    }
  },

  // Delete equipment
  delete: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const affectedRows = await Equipment.delete(req.params.id, hospitalId);

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Equipment not found"
        });
      }

      res.json({
        success: true,
        message: "Equipment deleted successfully"
      });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        error: "Delete failed"
      });
    }
  },

  // Search equipment
  search: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Search query is required"
        });
      }

      const equipment = await Equipment.search(query, hospitalId);

      res.json({
        success: true,
        equipment: equipment || [],
        count: equipment ? equipment.length : 0
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        error: "Search failed"
      });
    }
  },

  // Get equipment by status
  getByStatus: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const { status } = req.params;
      const equipment = await Equipment.getByStatus(status, hospitalId);

      res.json({
        success: true,
        equipment: equipment || [],
        count: equipment ? equipment.length : 0,
        status: status
      });
    } catch (error) {
      console.error('Status filter error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch equipment by status"
      });
    }
  },

  // Get equipment needing maintenance
  getMaintenanceNeeded: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const days = req.query.days || 30;
      const equipment = await Equipment.getMaintenanceNeeded(days, hospitalId);

      res.json({
        success: true,
        equipment: equipment || [],
        count: equipment ? equipment.length : 0,
        days: days
      });
    } catch (error) {
      console.error('Maintenance equipment error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch equipment needing maintenance"
      });
    }
  }
};

module.exports = equipmentController;