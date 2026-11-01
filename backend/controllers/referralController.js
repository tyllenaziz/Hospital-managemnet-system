const Referral = require("../models/Referral");
const Patient = require("../models/Patient");
const Queue = require("../models/Queue");


const referralController = {
  // Create a new referral
  create: async (req, res) => {
    try {
      const {
        patient_id, queue_id, referring_hospital, referred_to_hospital,
        referred_to_department, referral_reason, clinical_summary, diagnosis,
        patient_condition, vital_signs, services_needed, investigations_done,
        current_medications, referring_doctor_name, referring_doctor_phone,
        referring_doctor_email, priority, expected_visit_date, follow_up_required
      } = req.body;

      const doctor_id = req.user.id;
      const hospitalId = req.user.hospital_id;

      // Validate required fields
      if (!patient_id || !referring_hospital || !referred_to_hospital ||
        !referral_reason || !clinical_summary || !referring_doctor_name ||
        !referring_doctor_phone || !services_needed) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields"
        });
      }

      // Validate patient exists (scoped to hospital)
      const patient = await Patient.findById(patient_id, hospitalId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: "Patient not found"
        });
      }

      // Validate services_needed is an array
      if (!Array.isArray(services_needed) || services_needed.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one service must be selected"
        });
      }

      // Create referral
      const newReferral = await Referral.create({
        patient_id,
        doctor_id,
        queue_id: queue_id || null,
        referring_hospital,
        referred_to_hospital,
        referred_to_department,
        referral_reason,
        clinical_summary,
        diagnosis,
        patient_condition: patient_condition || 'Stable',
        vital_signs,
        services_needed,
        investigations_done,
        current_medications,
        referring_doctor_name,
        referring_doctor_phone,
        referring_doctor_email,
        priority: priority || 'Routine',
        expected_visit_date,
        follow_up_required: follow_up_required || false
      }, hospitalId);

      // If queue_id provided, update queue status
      if (queue_id) {
        await Queue.updateStatus(queue_id, 'referred');
      }

      res.status(201).json({
        success: true,
        message: "Referral created successfully",
        referral: newReferral
      });

    } catch (error) {
      console.error("❌ Create referral error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create referral"
      });
    }
  },

  // Get all referrals (admin/doctor view)
  getAll: async (req, res) => {
    try {
      const { status, priority } = req.query;

      let referrals;

      // If doctor, show only their referrals
      if (req.user.role === 'doctor') {
        referrals = await Referral.findByDoctorId(req.user.id, req.user.hospital_id);
      } else {
        referrals = await Referral.getAll(req.user.hospital_id);
      }

      // Filter by status if provided
      if (status) {
        referrals = referrals.filter(ref => ref.status === status);
      }

      // Filter by priority if provided
      if (priority) {
        referrals = referrals.filter(ref => ref.priority === priority);
      }

      res.json({
        success: true,
        count: referrals.length,
        referrals
      });

    } catch (error) {
      console.error("Get referrals error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch referrals"
      });
    }
  },

  // Get referral by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const referral = await Referral.findById(id, req.user.hospital_id);

      if (!referral) {
        return res.status(404).json({
          success: false,
          error: "Referral not found"
        });
      }

      // Check if user has permission to view this referral
      if (req.user.role === 'doctor' && referral.doctor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized to view this referral"
        });
      }

      res.json({
        success: true,
        referral
      });

    } catch (error) {
      console.error("Get referral error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch referral"
      });
    }
  },

  // Get referrals by patient ID
  getByPatientId: async (req, res) => {
    try {
      const { patientId } = req.params;

      const referrals = await Referral.findByPatientId(patientId, req.user.hospital_id);

      res.json({
        success: true,
        count: referrals.length,
        referrals
      });

    } catch (error) {
      console.error("Get patient referrals error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch patient referrals"
      });
    }
  },

  // Update referral status
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: "Status is required"
        });
      }

      const validStatuses = ['Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Invalid status"
        });
      }

      const referral = await Referral.findById(id, req.user.hospital_id);
      if (!referral) {
        return res.status(404).json({
          success: false,
          error: "Referral not found"
        });
      }

      const updated = await Referral.updateStatus(id, status, feedback, req.user.hospital_id);

      if (updated) {
        res.json({
          success: true,
          message: "Referral status updated successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Failed to update referral status"
        });
      }

    } catch (error) {
      console.error("Update referral status error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update referral status"
      });
    }
  },

  // Update referral details
  update: async (req, res) => {
    try {
      const { id } = req.params;

      const referral = await Referral.findById(id, req.user.hospital_id);
      if (!referral) {
        return res.status(404).json({
          success: false,
          error: "Referral not found"
        });
      }

      // Check if user has permission to update
      if (req.user.role === 'doctor' && referral.doctor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized to update this referral"
        });
      }

      // Can only update if status is Pending
      if (referral.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          error: "Cannot update referral that is not pending"
        });
      }

      const updated = await Referral.update(id, req.body, req.user.hospital_id);

      if (updated) {
        res.json({
          success: true,
          message: "Referral updated successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Failed to update referral"
        });
      }

    } catch (error) {
      console.error("Update referral error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update referral"
      });
    }
  },

  // Delete referral
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const referral = await Referral.findById(id, req.user.hospital_id);
      if (!referral) {
        return res.status(404).json({
          success: false,
          error: "Referral not found"
        });
      }

      // Check if user has permission to delete
      if (req.user.role === 'doctor' && referral.doctor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized to delete this referral"
        });
      }

      // Can only delete if status is Pending or Cancelled
      if (!['Pending', 'Cancelled'].includes(referral.status)) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete referral that is not pending or cancelled"
        });
      }

      const deleted = await Referral.delete(id, req.user.hospital_id);

      if (deleted) {
        res.json({
          success: true,
          message: "Referral deleted successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Failed to delete referral"
        });
      }

    } catch (error) {
      console.error("Delete referral error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete referral"
      });
    }
  },

  // Get referral statistics
  getStatistics: async (req, res) => {
    try {
      const doctorId = req.user.role === 'doctor' ? req.user.id : null;
      const stats = await Referral.getStatistics(doctorId, req.user.hospital_id);

      res.json({
        success: true,
        statistics: stats
      });

    } catch (error) {
      console.error("Get referral statistics error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch statistics"
      });
    }
  }
};

module.exports = referralController;