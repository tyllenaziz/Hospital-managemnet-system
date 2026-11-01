const ambulanceModel = require('../models/ambulanceModel');

const ambulanceController = {
  // Get all ambulances
  async getAmbulances(req, res) {
    try {
      const ambulances = await ambulanceModel.getAllAmbulances(req.user.hospital_id);
      res.json({ success: true, data: ambulances });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get available ambulances
  async getAvailableAmbulances(req, res) {
    try {
      const ambulances = await ambulanceModel.getAvailableAmbulances(req.user.hospital_id);
      res.json({ success: true, data: ambulances });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get ambulance by ID
  async getAmbulanceById(req, res) {
    try {
      const { id } = req.params;
      const ambulance = await ambulanceModel.getAmbulanceById(id, req.user.hospital_id);

      if (!ambulance) {
        return res.status(404).json({ success: false, error: 'Ambulance not found' });
      }

      res.json({ success: true, data: ambulance });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Create ambulance
  async createAmbulance(req, res) {
    try {
      const ambulanceData = req.body;

      // Validate required fields
      if (!ambulanceData.ambulance_number || !ambulanceData.driver_name || !ambulanceData.driver_phone) {
        return res.status(400).json({
          success: false,
          error: 'Ambulance number, driver name, and driver phone are required'
        });
      }

      ambulanceData.hospital_id = req.user.hospital_id;
      const result = await ambulanceModel.createAmbulance(ambulanceData);
      res.json({
        success: true,
        data: result,
        message: 'Ambulance created successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update ambulance
  async updateAmbulance(req, res) {
    try {
      const { id } = req.params;
      const ambulanceData = req.body;

      const result = await ambulanceModel.updateAmbulance(id, ambulanceData, req.user.hospital_id);
      res.json({
        success: true,
        data: result,
        message: 'Ambulance updated successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update ambulance status
  async updateAmbulanceStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required'
        });
      }

      const result = await ambulanceModel.updateAmbulanceStatus(id, status);
      res.json({
        success: true,
        data: result,
        message: 'Ambulance status updated successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete ambulance
  async deleteAmbulance(req, res) {
    try {
      const { id } = req.params;
      const result = await ambulanceModel.deleteAmbulance(id);
      res.json({
        success: true,
        data: result,
        message: 'Ambulance deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },


  // Create ambulance request
  async createAmbulanceRequest(req, res) {
    try {
      const requestData = {
        ...req.body,
        requested_by: req.user.id,
        hospital_id: req.user.hospital_id
      };

      // Validate required fields based on requester type
      if (requestData.requester_type === 'EXTERNAL') {
        // For external requests, hospital details are required, patient_id is optional
        if (!requestData.requesting_hospital_name || !requestData.requesting_hospital_location ||
          !requestData.requesting_hospital_contact || !requestData.requesting_hospital_contact_person) {
          return res.status(400).json({
            success: false,
            error: 'All referring hospital details are required for external requests'
          });
        }
      } else {
        // For internal requests, patient details are required
        if (!requestData.patient_id) {
          return res.status(400).json({
            success: false,
            error: 'Patient ID is required for internal requests'
          });
        }
        if (!requestData.patient_name || !requestData.patient_age || !requestData.patient_gender || !requestData.patient_phone) {
          return res.status(400).json({
            success: false,
            error: 'All patient details are required for internal requests'
          });
        }
      }

      // Common required fields for both types
      if (!requestData.destination) {
        return res.status(400).json({
          success: false,
          error: 'Destination is required'
        });
      }

      // Remove patient_condition requirement or make it use emergency_details
      // If patient_condition is not provided, use emergency_details or set default
      if (!requestData.patient_condition) {
        requestData.patient_condition = requestData.emergency_details || 'Patient transfer requested';
      }

      const result = await ambulanceModel.createAmbulanceRequest(requestData);
      res.json({
        success: true,
        data: result,
        message: 'Ambulance request created successfully'
      });
    } catch (error) {
      console.error('Error creating ambulance request:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Create incoming ambulance request
  async createIncomingRequest(req, res) {
    try {
      const requestData = {
        ...req.body,
        requested_by: req.user.id
      };

      // Validate required fields for incoming requests
      if (!requestData.patient_name) {
        return res.status(400).json({
          success: false,
          error: 'Patient name is required for incoming requests'
        });
      }

      if (!requestData.patient_condition) {
        return res.status(400).json({
          success: false,
          error: 'Patient condition is required'
        });
      }

      const result = await ambulanceModel.createIncomingAmbulanceRequest(requestData);
      res.json({
        success: true,
        data: result,
        message: 'Incoming ambulance request created successfully'
      });
    } catch (error) {
      console.error('Error creating incoming request:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get ambulance requests
  async getAmbulanceRequests(req, res) {
    try {
      const { direction, status, type, priority } = req.query;
      const filters = {};

      if (direction) filters.direction = direction;
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (priority) filters.priority = priority;

      const requests = await ambulanceModel.getAllAmbulanceRequests(filters, req.user.hospital_id);
      res.json({ success: true, data: requests });
    } catch (error) {
      console.error('Error fetching ambulance requests:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get request by ID
  async getRequestById(req, res) {
    try {
      const { id } = req.params;
      const request = await ambulanceModel.getAmbulanceRequestById(id);

      if (!request) {
        return res.status(404).json({ success: false, error: 'Request not found' });
      }

      res.json({ success: true, data: request });
    } catch (error) {
      console.error('Error fetching request by ID:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Approve request
  async approveRequest(req, res) {
    try {
      const { id } = req.params;
      const { doctor_notes } = req.body;

      if (!req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const result = await ambulanceModel.approveAmbulanceRequest(id, req.user.id, doctor_notes);
      res.json({
        success: true,
        data: result,
        message: 'Request approved successfully'
      });
    } catch (error) {
      console.error('Error approving request:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Mark as printed
  async markAsPrinted(req, res) {
    try {
      const { id } = req.params;

      if (!req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const result = await ambulanceModel.markAsPrinted(id, req.user.id);
      res.json({
        success: true,
        data: result,
        message: 'Request marked as printed'
      });
    } catch (error) {
      console.error('Error marking as printed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Assign ambulance
  async assignAmbulance(req, res) {
    try {
      const { id } = req.params;
      const { ambulance_id, assigned_driver } = req.body;

      if (!ambulance_id) {
        return res.status(400).json({
          success: false,
          error: 'Ambulance ID is required'
        });
      }

      const result = await ambulanceModel.assignAmbulanceToRequest(id, ambulance_id, assigned_driver);
      res.json({
        success: true,
        data: result,
        message: 'Ambulance assigned successfully'
      });
    } catch (error) {
      console.error('Error assigning ambulance:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update request status
  async updateRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required'
        });
      }

      const result = await ambulanceModel.updateRequestStatus(id, status);
      res.json({
        success: true,
        data: result,
        message: 'Request status updated successfully'
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get pending requests
  async getPendingRequests(req, res) {
    try {
      const requests = await ambulanceModel.getPendingRequests(req.user.hospital_id);
      res.json({ success: true, data: requests });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get requests by patient ID
  async getRequestsByPatientId(req, res) {
    try {
      const { patientId } = req.params;
      const requests = await ambulanceModel.getRequestsByPatientId(patientId);
      res.json({ success: true, data: requests });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get request statistics
  async getRequestStats(req, res) {
    try {
      const stats = await ambulanceModel.getRequestStats(req.user.hospital_id);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get requests by status
  async getRequestsByStatus(req, res) {
    try {
      const { status } = req.params;
      const requests = await ambulanceModel.getRequestsByStatus(status);
      res.json({ success: true, data: requests });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Search ambulance requests
  async searchAmbulanceRequests(req, res) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const requests = await ambulanceModel.searchAmbulanceRequests(q);
      res.json({ success: true, data: requests });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update ambulance request
  async updateAmbulanceRequest(req, res) {
    try {
      const { id } = req.params;
      const requestData = req.body;

      const result = await ambulanceModel.updateAmbulanceRequest(id, requestData);
      res.json({
        success: true,
        data: result,
        message: 'Ambulance request updated successfully'
      });
    } catch (error) {
      console.error('Error updating ambulance request:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = ambulanceController;