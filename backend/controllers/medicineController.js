const Medicine = require("../models/Medicine");
const db = require("../config/dbconfig");

const medicineController = {
  // Get all medicines
  getAll: async (req, res) => {
    try {
      const hospitalId = req.user.hospital_id;
      const medicines = await Medicine.getAll(hospitalId);

      res.json({
        success: true,
        medicines: medicines || [],
        count: medicines ? medicines.length : 0
      });
    } catch (error) {
      console.error('Error fetching medicines:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch medicines"
      });
    }
  },

  // Get medicine by ID
  getById: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const medicine = await Medicine.getById(req.params.id, hospitalId);

      if (!medicine) {
        return res.status(404).json({
          success: false,
          error: "Medicine not found"
        });
      }

      res.json({
        success: true,
        medicine
      });
    } catch (error) {
      console.error('Error fetching medicine:', error);
      res.status(500).json({
        success: false,
        error: "Database error"
      });
    }
  },

  // Get medicine by barcode (for scanning)
  getByBarcode: async (req, res) => {
    try {
      const { barcode } = req.params;
      const hospitalId = req.user.hospital_id;
      const medicine = await Medicine.getByBarcode(barcode, hospitalId);

      if (!medicine) {
        return res.json({
          success: true,
          exists: false,
          medicine: null
        });
      }

      res.json({
        success: true,
        exists: true,
        medicine
      });
    } catch (error) {
      console.error('Error fetching medicine by barcode:', error);
      res.status(500).json({
        success: false,
        error: "Database error"
      });
    }
  },

  // Add new medicine to inventory
  create: async (req, res) => {
    try {
      const { name, barcode, stock, price, expiry_date } = req.body;

      if (!name || !barcode || stock === undefined || !price || !expiry_date) {
        return res.status(400).json({
          success: false,
          error: "All fields are required"
        });
      }

      const hospital_id = req.user.hospital_id;
      const medicine = await Medicine.create({ name, barcode, stock, price, expiry_date, hospital_id });

      res.json({
        success: true,
        message: "Medicine added successfully",
        medicine
      });
    } catch (error) {
      console.error("Medicine creation error:", error);
      res.status(400).json({
        success: false,
        error: "Medicine creation failed",
        details: error.message
      });
    }
  },

  // Update medicine
  update: async (req, res) => {
    try {
      const { name, barcode, stock, price, expiry_date } = req.body;

      if (!name || !barcode || stock === undefined || !price || !expiry_date) {
        return res.status(400).json({
          success: false,
          error: "All fields are required"
        });
      }

      const hospitalId = req.user?.hospital_id;
      const affectedRows = await Medicine.update(req.params.id, { name, barcode, stock, price, expiry_date }, hospitalId);

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Medicine not found"
        });
      }

      res.json({
        success: true,
        message: "Medicine updated successfully"
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

  // Delete medicine
  delete: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const affectedRows = await Medicine.delete(req.params.id, hospitalId);

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Medicine not found"
        });
      }

      res.json({
        success: true,
        message: "Medicine deleted successfully"
      });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        error: "Delete failed"
      });
    }
  },

  // Search medicines
  search: async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Search query is required"
        });
      }

      const hospitalId = req.user.hospital_id;
      const medicines = await Medicine.search(query, hospitalId);

      res.json({
        success: true,
        medicines: medicines || [],
        count: medicines ? medicines.length : 0
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        error: "Search failed"
      });
    }
  },

  // Get low stock medicines
  getLowStock: async (req, res) => {
    try {
      const threshold = req.query.threshold || 20;
      const hospitalId = req.user.hospital_id;
      const medicines = await Medicine.getLowStock(threshold, hospitalId);

      res.json({
        success: true,
        medicines: medicines || [],
        count: medicines ? medicines.length : 0,
        threshold: threshold
      });
    } catch (error) {
      console.error('Low stock error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch low stock medicines"
      });
    }
  },

  // Get expiring medicines
  getExpiringSoon: async (req, res) => {
    try {
      const days = req.query.days || 90;
      const hospitalId = req.user.hospital_id;
      const medicines = await Medicine.getExpiringSoon(days, hospitalId);

      res.json({
        success: true,
        medicines: medicines || [],
        count: medicines ? medicines.length : 0,
        days: days
      });
    } catch (error) {
      console.error('Expiring medicines error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch expiring medicines"
      });
    }
  }
};

module.exports = medicineController;