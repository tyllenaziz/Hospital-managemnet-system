const Queue = require("../models/Queue");
const Vitals = require("../models/Vitals");
const db = require("../config/dbconfig");

const queueController = {
  // Get queue for specific department
  getQueue: async (req, res) => {
    try {
      const { department } = req.params;
      const status = req.query.status || null;

      const validDepartments = ['doctor', 'nurse', 'lab', 'pharmacy', 'billing'];
      if (!validDepartments.includes(department)) {
        return res.status(400).json({
          success: false,
          error: "Invalid department. Must be one of: doctor, nurse, lab, pharmacy, billing"
        });
      }

      const hostpitalId = req.user?.hospital_id;

      await Queue.autoExpireOldQueue();
      const queue = await Queue.getByDepartment(department, status, hostpitalId);

      res.json(queue);
    } catch (error) {
      console.error("Get queue error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch queue"
      });
    }
  },
  recordVitals: async (req, res) => {
    try {
      const { queueId } = req.params;
      const {
        blood_pressure_systolic,
        blood_pressure_diastolic,
        temperature,
        pulse_rate,
        respiratory_rate,
        weight,
        height,
        blood_sugar,
        oxygen_saturation,
        bmi,
        notes,
        drug_allergies
      } = req.body;

      if (!queueId || isNaN(queueId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid queue ID"
        });
      }

      const queueItem = await Queue.getById(queueId);

      if (!queueItem) {
        return res.status(404).json({
          success: false,
          error: "Queue item not found or has expired"
        });
      }

      // Check authorization
      if (queueItem.assigned_to !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "You are not assigned to this patient"
        });
      }

      const vitalsData = {
        queue_id: queueId,
        patient_id: queueItem.patient_id,
        recorded_by: req.user.id,
        blood_pressure_systolic,
        blood_pressure_diastolic,
        temperature,
        pulse_rate,
        respiratory_rate,
        weight,
        height,
        blood_sugar,
        oxygen_saturation,
        bmi,
        notes,
        drug_allergies
      };

      const vitals = await Vitals.createOrUpdate(vitalsData);

      // If nurse recorded vitals, transfer to doctor
      if (req.user.role === 'nurse') {
        const newQueue = await Queue.transferToNextDepartment(
          queueId,
          queueItem.patient_id,
          'doctor',
          req.user.hospital_id
        );

        res.json({
          success: true,
          message: "Vitals recorded successfully. Patient sent to doctor.",
          vitals,
          newQueue
        });
      } else {
        // Doctor updated vitals, just save and continue
        res.json({
          success: true,
          message: "Vitals updated successfully",
          vitals
        });
      }
    } catch (error) {
      console.error("Record vitals error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to record vitals",
        details: error.message
      });
    }
  },

  getVitals: async (req, res) => {
    try {
      const { queueId } = req.params;

      if (!queueId || isNaN(queueId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid queue ID"
        });
      }

      const queueItem = await Queue.getById(queueId);

      if (!queueItem) {
        return res.status(404).json({
          success: false,
          error: "Queue item not found or has expired"
        });
      }

      const vitals = await Vitals.getLatestByPatientId(queueItem.patient_id);

      res.json({
        success: true,
        vitals,
        patient_id: queueItem.patient_id
      });
    } catch (error) {
      console.error("Get vitals error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch vitals"
      });
    }
  },

  fetchPatient: async (req, res) => {
    try {
      const { queueId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!queueId || isNaN(queueId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid queue ID"
        });
      }

      const patient = await Queue.getById(queueId, req.user.hospital_id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: "Patient not found or queue item has expired (older than 24 hours)"
        });
      }

      // Allow reopening completed consultations
      if (patient.status === 'done') {
        // Only allow the same doctor or unassigned to reopen
        if (patient.assigned_to && patient.assigned_to !== userId) {
          return res.status(403).json({
            success: false,
            error: "This completed consultation is assigned to another doctor"
          });
        }

        await Queue.reopenConsultation(queueId, userId);

        // Fetch existing prescription with items
        let existingPrescription = null;
        try {
          const prescriptionSql = `
          SELECT p.*, 
                 pi.id as item_id, pi.medicine_id, pi.custom_medicine_name,
                 pi.quantity, pi.dosage, pi.duration, pi.instructions,
                 m.name as medicine_name, m.price
          FROM prescriptions p
          LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
          LEFT JOIN medicines m ON pi.medicine_id = m.id
          WHERE p.queue_id = ?
        `;

          const [results] = await db.query(prescriptionSql, [queueId]);

          if (results && results.length > 0) {
            existingPrescription = {
              id: results[0].id,
              queue_id: results[0].queue_id,
              patient_id: results[0].patient_id,
              doctor_id: results[0].doctor_id,
              notes: results[0].notes,
              diagnosis: results[0].diagnosis,
              status: results[0].status,
              created_at: results[0].created_at,
              items: results.filter(r => r.item_id).map(r => ({
                id: r.item_id,
                medicine_id: r.medicine_id,
                custom_medicine_name: r.custom_medicine_name,
                medicine_name: r.medicine_name,
                quantity: r.quantity,
                dosage: r.dosage,
                duration: r.duration,
                instructions: r.instructions,
                price: r.price
              }))
            };
          }
        } catch (err) {
        }

        // Fetch existing lab order with tests
        let existingLabOrder = null;
        try {
          const labOrderSql = `
          SELECT lo.*, 
                 loi.lab_test_id as test_id, 
                 lt.test_name
          FROM lab_orders lo
          LEFT JOIN lab_order_items loi ON lo.id = loi.lab_order_id
          LEFT JOIN lab_tests lt ON loi.lab_test_id = lt.id
          WHERE lo.queue_id = ? AND lo.hospital_id = ?
        `;

          const [labResults] = await db.query(labOrderSql, [queueId, req.user.hospital_id]);

          if (labResults && labResults.length > 0) {
            existingLabOrder = {
              id: labResults[0].id,
              queue_id: labResults[0].queue_id,
              patient_id: labResults[0].patient_id,
              doctor_id: labResults[0].doctor_id,
              notes: labResults[0].notes,
              status: labResults[0].status,
              tests: labResults.filter(r => r.test_id).map(r => ({
                test_id: r.test_id,
                test_name: r.test_name
              }))
            };
          }
        } catch (err) {
        }

        res.json({
          success: true,
          message: "Consultation reopened for modifications",
          isReopened: true,
          patient: {
            ...patient,
            assigned_to: userId,
            status: 'in_progress'
          },
          existingPrescription,
          existingLabOrder
        });
        return;
      }

      if (patient.status !== 'waiting' && patient.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          error: "Patient has already been processed"
        });
      }

      // Check if already assigned to someone else
      if (patient.assigned_to && patient.assigned_to !== userId && patient.status === 'in_progress') {
        return res.status(409).json({
          success: false,
          error: "This patient is already assigned to another staff member"
        });
      }

      // For fresh consultations, just assign and mark in_progress
      const sql = "UPDATE queue SET assigned_to = ?, status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?";
      await db.query(sql, [userId, queueId]);

      res.json({
        success: true,
        message: "Patient fetched successfully",
        isReopened: false,
        patient: {
          ...patient,
          assigned_to: userId,
          status: 'in_progress'
        },
        existingPrescription: null,
        existingLabOrder: null
      });
    } catch (error) {
      console.error("Fetch patient error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch patient"
      });
    }
  },

  completeConsultation: async (req, res) => {
    try {
      const { queueId } = req.params;
      const { notes, diagnosis, prescription_items } = req.body;

      if (!queueId || isNaN(queueId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid queue ID"
        });
      }

      const queueItem = await Queue.getById(queueId, req.user.hospital_id);

      if (!queueItem) {
        return res.status(404).json({
          success: false,
          error: "Queue item not found or has expired"
        });
      }

      if (queueItem.assigned_to !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "You are not assigned to this patient"
        });
      }

      const Bill = require("../models/Bill");
      const billData = {
        patient_id: queueItem.patient_id,
        queue_id: queueId,
        created_by: req.user.id,
        hospital_id: req.user.hospital_id
      };

      const bill = await Bill.createOrUpdate(billData);

      // If there are prescription items, create/update prescription
      if (prescription_items && prescription_items.length > 0) {
        const validPrescriptionItems = prescription_items.filter(
          item => (item.medicine_id !== '' || item.custom_medicine_name?.trim() !== '') && item.quantity > 0
        );

        if (validPrescriptionItems.length > 0) {
          const Prescription = require("../models/Prescription");

          // Check if prescription already exists for this queue
          const existingPrescription = await Prescription.getByQueueId(queueId, req.user.hospital_id);

          const prescriptionData = {
            queue_id: queueId,
            patient_id: queueItem.patient_id,
            doctor_id: req.user.id,
            hospital_id: req.user.hospital_id,
            notes,
            diagnosis,
            items: validPrescriptionItems.map(item => ({
              medicine_id: item.medicine_id || null,
              custom_medicine_name: item.custom_medicine_name?.trim() || null,
              quantity: item.quantity,
              dosage: item.dosage,
              duration: item.duration,
              instructions: item.instructions
            }))
          };

          let prescription;
          if (existingPrescription) {
            // Update existing prescription
            prescription = await Prescription.update(existingPrescription.id, prescriptionData);
          } else {
            // Create new prescription
            prescription = await Prescription.create(prescriptionData);
          }

          const newQueue = await Queue.transferToNextDepartment(
            queueId,
            queueItem.patient_id,
            'pharmacy',
            req.user.hospital_id
          );

          res.json({
            success: true,
            message: "Consultation completed and patient sent to pharmacy",
            prescription,
            bill,
            newQueue
          });
          return;
        }
      }

      await Queue.updateStatus(queueId, 'done', null);

      res.json({
        success: true,
        message: "Consultation completed",
        bill
      });
    } catch (error) {
      console.error("Complete consultation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to complete consultation",
        details: error.message
      });
    }
  },

  completeConsultationWithLab: async (req, res) => {
    try {
      const { queueId } = req.params;
      const { notes, diagnosis, lab_tests } = req.body;

      if (!queueId || isNaN(queueId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid queue ID"
        });
      }

      const queueItem = await Queue.getById(queueId, req.user.hospital_id);

      if (!queueItem) {
        return res.status(404).json({
          success: false,
          error: "Queue item not found or has expired"
        });
      }

      if (queueItem.assigned_to !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "You are not assigned to this patient"
        });
      }

      if (!lab_tests || lab_tests.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No lab tests specified"
        });
      }

      const LabOrder = require("../models/LabOrder");
      const Bill = require("../models/Bill");

      // Check if lab order already exists for this queue
      const existingLabOrder = await LabOrder.getByQueueId(queueId, req.user.hospital_id);

      const labOrderData = {
        queue_id: queueId,
        patient_id: queueItem.patient_id,
        doctor_id: req.user.id,
        hospital_id: req.user.hospital_id,
        notes: notes,
        tests: lab_tests
      };

      let labOrder;
      if (existingLabOrder) {
        // Update existing lab order
        labOrder = await LabOrder.update(existingLabOrder.id, labOrderData);
      } else {
        // Create new lab order
        labOrder = await LabOrder.create(labOrderData);
      }

      const billData = {
        patient_id: queueItem.patient_id,
        queue_id: queueId,
        created_by: req.user.id
      };

      const bill = await Bill.createOrUpdate(billData);
      await Bill.addLabTests(bill.id, labOrder.id);

      const newQueue = await Queue.transferToNextDepartment(
        queueId,
        queueItem.patient_id,
        'lab',
        req.user.hospital_id
      );

      res.json({
        success: true,
        message: "Lab tests ordered, bill created and patient sent to lab",
        labOrder,
        bill,
        newQueue
      });
    } catch (error) {
      console.error("Lab consultation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process lab order"
      });
    }
  },

  labComplete: async (req, res) => {
    try {
      const { queueId } = req.params;
      const { labOrderId } = req.body;

      if (!queueId || isNaN(queueId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid queue ID"
        });
      }

      if (!labOrderId) {
        return res.status(400).json({
          success: false,
          error: "Lab order ID is required"
        });
      }

      const queueItem = await Queue.getById(queueId, req.user.hospital_id);

      if (!queueItem) {
        return res.status(404).json({
          success: false,
          error: "Queue item not found or has expired"
        });
      }

      await db.query(
        `UPDATE lab_orders 
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND hospital_id = ?`,
        [labOrderId, req.user.hospital_id]
      );

      const newQueue = await Queue.returnPatientToDepartment(
        queueId,
        queueItem.patient_id,
        'doctor',
        req.user.hospital_id
      );

      const labResultsNote = `[LAB RESULTS READY - Order #${labOrderId}]`;
      const updateNotesSql = `
        UPDATE queue 
        SET notes = CASE
          WHEN IFNULL(notes, '') LIKE ?
            THEN notes
          WHEN IFNULL(notes, '') = ''
            THEN ?
          ELSE CONCAT(notes, '\\n', ?)
        END
        WHERE id = ?
      `;

      await db.query(updateNotesSql, [`%${labResultsNote}%`, labResultsNote, labResultsNote, newQueue.id]);

      res.json({
        success: true,
        message: "Lab results submitted and patient sent back to doctor",
        newQueue
      });
    } catch (error) {
      console.error("Lab complete error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to complete lab"
      });
    }
  },

  pharmacyComplete: async (req, res) => {
    try {
      const { queueId } = req.params;
      const { dispensedMedicine, prescriptionId } = req.body;

      if (!queueId || isNaN(queueId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid queue ID"
        });
      }

      if (!dispensedMedicine || dispensedMedicine.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Dispensed medicine information is required"
        });
      }

      const queueItem = await Queue.getById(queueId);

      if (!queueItem) {
        return res.status(404).json({
          success: false,
          error: "Queue item not found or has expired"
        });
      }

      if (prescriptionId) {
        const Bill = require("../models/Bill");
        const existingBill = await Bill.getByQueueId(queueId);

        if (existingBill) {
          await Bill.addMedicines(existingBill.id, prescriptionId);
        }
      }

      const sql = "UPDATE queue SET status = 'done', notes = CONCAT(IFNULL(notes, ''), '\\nDispensed: ', ?) WHERE id = ?";
      await db.query(sql, [dispensedMedicine, queueId]);

      res.json({
        success: true,
        message: "Medicine dispensed successfully and bill updated"
      });
    } catch (error) {
      console.error("Pharmacy complete error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to complete pharmacy transaction"
      });
    }
  },

  cancel: async (req, res) => {
    try {
      const { queueId } = req.params;
      const { reason } = req.body;

      if (!queueId || isNaN(queueId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid queue ID"
        });
      }

      const queueItem = await Queue.getById(queueId);

      if (!queueItem) {
        return res.status(404).json({
          success: false,
          error: "Queue item not found or has expired"
        });
      }

      if (reason) {
        const sql = `
          UPDATE queue 
          SET status = 'cancelled', 
              notes = CONCAT(IFNULL(notes, ''), '\\n[CANCELLED: ', ?, ']')
          WHERE id = ?
        `;
        await db.query(sql, [reason, queueId]);
      } else {
        await Queue.updateStatus(queueId, 'cancelled', null);
      }

      res.json({
        success: true,
        message: "Queue item cancelled successfully"
      });
    } catch (error) {
      console.error("Cancel queue error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to cancel queue item"
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid queue ID"
        });
      }

      const queueItem = await Queue.getById(id);

      if (!queueItem) {
        return res.status(404).json({
          success: false,
          error: "Queue item not found or has expired (older than 24 hours)"
        });
      }

      res.json({
        success: true,
        queue: queueItem
      });
    } catch (error) {
      console.error('Error fetching queue:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch queue item"
      });
    }
  },

  getExpiringQueue: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const expiringQueue = await Queue.getExpiringQueue(hospitalId);
      res.json({
        success: true,
        count: expiringQueue.length,
        queue: expiringQueue
      });
    } catch (error) {
      console.error('Error fetching expiring queue:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch expiring queue items"
      });
    }
  }
};

module.exports = queueController;
