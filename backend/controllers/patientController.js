const Patient = require("../models/Patient");
const Queue = require("../models/Queue");
const db = require("../config/dbconfig");
const auditLogger = require("../utils/auditLogger");
const Bill = require("../models/Bill");

const patientController = {
  // Reception: Register patient and add to queue (nurse or doctor)
  register: async (req, res) => {
    try {
      const {
        name, phone, alternative_phone, email, age, gender, id_number,
        next_of_kin_name, next_of_kin_phone, next_of_kin_relationship,
        county, town, address, house_number,
        initial_queue // NEW: 'nurse' or 'doctor'
      } = req.body;

      // Validate required fields
      if (!name || !phone || !age || !gender || !id_number) {
        return res.status(400).json({
          success: false,
          error: "Name, phone, age, gender, and ID number are required"
        });
      }

      // Validate initial_queue parameter
      const targetQueue = initial_queue || 'nurse'; // Default to nurse
      if (!['nurse', 'doctor'].includes(targetQueue)) {
        return res.status(400).json({
          success: false,
          error: "Initial queue must be either 'nurse' or 'doctor'"
        });
      }

      // Validate primary phone format (Kenyan format)
      if (!/^0[17]\d{8}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          error: "Invalid phone number format. Use format: 0712345678"
        });
      }

      // Validate alternative phone if provided
      if (alternative_phone && !/^0[17]\d{8}$/.test(alternative_phone)) {
        return res.status(400).json({
          success: false,
          error: "Invalid alternative phone number format. Use format: 0712345678"
        });
      }

      // Validate next of kin phone if provided
      if (next_of_kin_phone && !/^0[17]\d{8}$/.test(next_of_kin_phone)) {
        return res.status(400).json({
          success: false,
          error: "Invalid next of kin phone number format. Use format: 0712345678"
        });
      }

      // Validate email if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email format"
        });
      }

      // Validate age
      if (age < 0 || age > 150) {
        return res.status(400).json({
          success: false,
          error: "Please enter a valid age between 0 and 150"
        });
      }

      const hospitalId = req.user?.hospital_id;

      // Check for existing patient with same ID number inside this hospital tenant
      const existingPatient = await Patient.findByIdNumber(id_number, hospitalId);
      if (existingPatient) {
        return res.status(409).json({
          success: false,
          error: "A patient with this ID/Passport number already exists",
          existingPatient: {
            id: existingPatient.id,
            patient_number: existingPatient.patient_number,
            name: existingPatient.name,
            phone: existingPatient.phone
          },
          code: 'DUPLICATE_ENTRY',
          field: 'ID/Passport number'
        });
      }

      // Check for existing patient with same phone
      const existingPhone = await Patient.findByPhone(phone, hospitalId);
      if (existingPhone && existingPhone.id_number !== id_number) {
        return res.status(409).json({
          success: false,
          error: "A patient with this phone number already exists",
          existingPatient: {
            id: existingPhone.id,
            patient_number: existingPhone.patient_number,
            name: existingPhone.name,
            id_number: existingPhone.id_number
          },
          code: 'DUPLICATE_ENTRY',
          field: 'phone number'
        });
      }

      // Check for existing email if provided
      if (email) {
        const existingEmail = await Patient.findByEmail(email, hospitalId);
        if (existingEmail && existingEmail.id_number !== id_number) {
          return res.status(409).json({
            success: false,
            error: "A patient with this email already exists",
            existingPatient: {
              id: existingEmail.id,
              patient_number: existingEmail.patient_number,
              name: existingEmail.name,
              phone: existingEmail.phone
            },
            code: 'DUPLICATE_ENTRY',
            field: 'email'
          });
        }
      }

      // Get hospital details from logged in user
      let hospitalCode = 'BMP'; // Default Fallback

      if (hospitalId) {
        try {
          const [hospitalResult] = await db.query("SELECT code FROM hospitals WHERE id = ?", [hospitalId]);
          if (hospitalResult.length > 0) {
            hospitalCode = hospitalResult[0].code;
          }
        } catch (err) {
          console.error("Error fetching hospital code:", err);
        }
      }

      // Create new patient
      const newPatient = await Patient.create({
        name: name.trim(),
        phone: phone.trim(),
        alternative_phone: alternative_phone?.trim() || null,
        email: email?.trim() || null,
        age: parseInt(age),
        gender,
        id_number: id_number.trim(),
        next_of_kin_name: next_of_kin_name?.trim() || null,
        next_of_kin_phone: next_of_kin_phone?.trim() || null,
        next_of_kin_relationship: next_of_kin_relationship?.trim() || null,
        county: county?.trim() || null,
        town: town?.trim() || null,
        address: address?.trim() || null,
        house_number: house_number?.trim() || null
      }, hospitalId, hospitalCode);

      // Add to selected queue (nurse or doctor)
      const queueData = await Queue.addToQueue(newPatient.id, targetQueue, hospitalId);

      // Handle payment and bill creation
      let billData = null;
      let paymentData = null;
      const payment = req.body.payment;

      if (payment && payment.amount > 0) {
        try {
          const hospitalId = req.user?.hospital_id || null;

          // Get consultation fee from hospital-scoped settings
          const settings = await Bill.getSettings(hospitalId);
          const consultationFee = settings.consultation_fee;

          // Create bill
          const [billResult] = await db.query(
            `INSERT INTO bills (patient_id, queue_id, consultation_fee, total_amount, final_amount, payment_status, created_by, hospital_id) 
             VALUES (?, ?, ?, ?, ?, 'paid', ?, ?)`,
            [newPatient.id, queueData.id, consultationFee, consultationFee, consultationFee, req.user.id, hospitalId]
          );

          const billId = billResult.insertId;

          // Add consultation fee as bill item
          await db.query(
            `INSERT INTO bill_items (bill_id, queue_id, item_type, description, amount, subtotal)
             VALUES (?, ?, 'consultation', 'Consultation Fee', ?, ?)`,
            [billId, queueData.id, consultationFee, consultationFee]
          );

          // Record payment (hospital-scoped receipt generation lives in Bill.addPayment)
          const paymentResult = await Bill.addPayment(billId, {
            amount: payment.amount,
            payment_method: payment.payment_method,
            reference_number: payment.reference || null,
            received_by: req.user.id
          });

          billData = { id: billId, amount: consultationFee };
          paymentData = {
            receipt_number: paymentResult.receiptNumber,
            method: payment.payment_method,
            amount: payment.amount
          };

        } catch (paymentError) {
          console.error("Payment processing error:", paymentError);
          // Continue with registration even if payment recording fails
          // The bill can be created later
        }
      }

      // Log patient registration to audit trail
      await auditLogger.logCreate(req, 'patient', newPatient.id,
        `Registered new patient: ${newPatient.name} (${newPatient.patient_number})${payment ? ' with consultation fee payment' : ''}`,
        { name: newPatient.name, patient_number: newPatient.patient_number, phone: newPatient.phone, payment: payment?.payment_method }
      );

      res.status(201).json({
        success: true,
        message: `Patient registered successfully and added to ${targetQueue} queue`,
        patient: newPatient,
        queue: queueData,
        assigned_to: targetQueue,
        bill: billData,
        payment: paymentData
      });

    } catch (error) {
      console.error("❌ Patient registration error:", error);

      // Handle specific MySQL errors
      if (error.code === 'ER_DUP_ENTRY') {
        let field = 'record';
        let userMessage = 'This patient already exists in the system';

        if (error.message.includes('id_number')) {
          field = 'ID/Passport number';
          userMessage = 'A patient with this ID/Passport number is already registered';
        } else if (error.message.includes('phone')) {
          field = 'phone number';
          userMessage = 'A patient with this phone number is already registered';
        } else if (error.message.includes('email')) {
          field = 'email';
          userMessage = 'A patient with this email is already registered';
        } else if (error.message.includes('patient_number')) {
          field = 'patient number';
          userMessage = 'Patient number conflict. Please try again.';
        }

        return res.status(409).json({
          success: false,
          error: userMessage,
          field: field,
          code: 'DUPLICATE_ENTRY'
        });
      }

      if (error.code === 'ER_DATA_TOO_LONG') {
        return res.status(400).json({
          success: false,
          error: "One or more fields exceed the maximum allowed length",
          code: 'DATA_TOO_LONG'
        });
      }

      if (error.code === 'ER_BAD_NULL_ERROR') {
        return res.status(400).json({
          success: false,
          error: "Required field is missing",
          code: 'MISSING_FIELD'
        });
      }

      res.status(500).json({
        success: false,
        error: "Patient registration failed. Please try again.",
        code: 'REGISTRATION_FAILED'
      });
    }
  },

  getAll: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;
      const patients = await Patient.getAll(hospitalId);
      res.json({
        success: true,
        count: patients.length,
        patients
      });
    } catch (error) {
      console.error("Get patients error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch patients"
      });
    }
  },

  search: async (req, res) => {
    try {
      const { query } = req.query;
      const hospitalId = req.user?.hospital_id;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Search query must be at least 2 characters"
        });
      }

      const patients = await Patient.search(query.trim(), hospitalId);
      res.json({
        success: true,
        count: patients.length,
        patients
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({
        success: false,
        error: "Search failed"
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid patient ID"
        });
      }

      const patient = await Patient.findById(id, req.user?.hospital_id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: "Patient not found"
        });
      }

      res.json({
        success: true,
        patient
      });
    } catch (error) {
      console.error("Get patient error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch patient"
      });
    }
  },

  getByPatientNumber: async (req, res) => {
    try {
      const { patientNumber } = req.params;

      if (!patientNumber) {
        return res.status(400).json({
          success: false,
          error: "Patient number is required"
        });
      }

      const patient = await Patient.findByPatientNumber(patientNumber);

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: "Patient not found"
        });
      }

      res.json({
        success: true,
        patient
      });
    } catch (error) {
      console.error("Get patient by number error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch patient"
      });
    }
  },
  /**
   * Get patient visit history (non-sensitive data only)
   * Safe for reception and general staff viewing
   */
  getVisitHistory: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid patient ID"
        });
      }

      // Verify patient exists
      const patient = await Patient.findById(id, req.user?.hospital_id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: "Patient not found"
        });
      }

      // Get visit history
      const visitHistory = await Patient.getVisitHistory(id);

      // Get visit statistics
      const visitStats = await Patient.getVisitStats(id);

      // Format the response
      const formattedHistory = visitHistory.map(visit => ({
        id: visit.id,
        queue_number: visit.queue_number,
        department: visit.department,
        status: visit.status,
        visit_date: visit.visit_date,
        attended_by: visit.attended_by || 'Not assigned',
        has_lab_tests: visit.has_lab_tests,
        has_prescription: visit.has_prescription,
        // Only include basic vitals if they exist
        vitals: (visit.blood_pressure_systolic || visit.temperature || visit.pulse_rate) ? {
          blood_pressure: visit.blood_pressure_systolic && visit.blood_pressure_diastolic
            ? `${visit.blood_pressure_systolic}/${visit.blood_pressure_diastolic}`
            : null,
          temperature: visit.temperature,
          pulse_rate: visit.pulse_rate,
          weight: visit.weight,
          height: visit.height
        } : null
      }));

      res.json({
        success: true,
        patient: {
          id: patient.id,
          patient_number: patient.patient_number,
          name: patient.name,
          age: patient.age,
          gender: patient.gender
        },
        statistics: {
          total_visits: visitStats.total_visits || 0,
          by_department: {
            doctor: visitStats.doctor_visits || 0,
            nurse: visitStats.nurse_visits || 0,
            lab: visitStats.lab_visits || 0,
            pharmacy: visitStats.pharmacy_visits || 0
          },
          first_visit: visitStats.first_visit_date,
          last_visit: visitStats.last_visit_date
        },
        visit_history: formattedHistory,
        count: formattedHistory.length
      });

    } catch (error) {
      console.error("Get visit history error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch visit history"
      });
    }
  },

  /**
   * Get detailed visit information (requires appropriate role)
   * This endpoint includes sensitive medical information
   */
  getVisitDetails: async (req, res) => {
    try {
      const { visitId } = req.params;
      const userRole = req.user?.role;

      // Only doctors, nurses, and admins can view sensitive details
      const allowedRoles = ['doctor', 'nurse', 'admin', 'supervisor'];
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions to view medical details"
        });
      }

      if (!visitId || isNaN(visitId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid visit ID"
        });
      }

      const sql = `
        SELECT 
          q.*,
          p.name as patient_name,
          p.patient_number,
          p.age,
          p.gender,
          u.username as attended_by,
          v.blood_pressure_systolic,
          v.blood_pressure_diastolic,
          v.temperature,
          v.pulse_rate,
          v.respiratory_rate,
          v.weight,
          v.height,
          v.blood_sugar,
          v.oxygen_saturation,
          v.bmi,
          v.notes as vital_notes,
          v.drug_allergies
        FROM queue q
        JOIN patients p ON q.patient_id = p.id
        LEFT JOIN users u ON q.assigned_to = u.id
        LEFT JOIN vitals v ON q.id = v.queue_id
        WHERE q.id = ?
      `;

      const [results] = await db.query(sql, [visitId]);

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Visit not found"
        });
      }

      const visit = results[0];

      res.json({
        success: true,
        visit: {
          id: visit.id,
          queue_number: visit.queue_number,
          department: visit.department,
          status: visit.status,
          visit_date: visit.created_at,
          patient: {
            name: visit.patient_name,
            patient_number: visit.patient_number,
            age: visit.age,
            gender: visit.gender
          },
          attended_by: visit.attended_by,
          diagnosis: visit.diagnosis,
          prescription: visit.prescription,
          notes: visit.notes,
          vitals: {
            blood_pressure: visit.blood_pressure_systolic && visit.blood_pressure_diastolic
              ? `${visit.blood_pressure_systolic}/${visit.blood_pressure_diastolic}`
              : null,
            temperature: visit.temperature,
            pulse_rate: visit.pulse_rate,
            respiratory_rate: visit.respiratory_rate,
            weight: visit.weight,
            height: visit.height,
            blood_sugar: visit.blood_sugar,
            oxygen_saturation: visit.oxygen_saturation,
            bmi: visit.bmi,
            notes: visit.vital_notes,
            drug_allergies: visit.drug_allergies
          }
        }
      });

    } catch (error) {
      console.error("Get visit details error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch visit details"
      });
    }
  },

  /**
   * Create a new visit for an existing patient
   * Used when a patient returns for a new consultation
   */
  createVisit: async (req, res) => {
    try {
      const { id } = req.params;
      const { initial_queue, reason } = req.body;

      // Validate patient ID
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid patient ID"
        });
      }

      // Validate initial_queue parameter
      const targetQueue = initial_queue || 'nurse';
      if (!['nurse', 'doctor'].includes(targetQueue)) {
        return res.status(400).json({
          success: false,
          error: "Initial queue must be either 'nurse' or 'doctor'"
        });
      }

      // Verify patient exists
      const patient = await Patient.findById(id, req.user?.hospital_id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: "Patient not found"
        });
      }

      // Check if patient already has an active visit today
      const existingVisitSql = `
        SELECT id, queue_number, department, status 
        FROM queue 
        WHERE patient_id = ? 
          AND DATE(created_at) = CURDATE() 
          AND status IN ('waiting', 'in_progress')
      `;
      const [existingVisits] = await db.query(existingVisitSql, [id]);

      if (existingVisits.length > 0) {
        return res.status(409).json({
          success: false,
          error: "Patient already has an active visit today",
          existingVisit: existingVisits[0],
          code: 'ACTIVE_VISIT_EXISTS'
        });
      }

      // Create new queue entry (visit)
      const queueData = await Queue.addToQueue(parseInt(id), targetQueue, req.user?.hospital_id || null);

      // Update notes with reason if provided
      if (reason) {
        await db.query(
          "UPDATE queue SET notes = ? WHERE id = ?",
          [reason, queueData.id]
        );
      }

      // Handle payment and bill creation for returning patients
      let billData = null;
      let paymentData = null;
      const payment = req.body.payment;

      if (payment && payment.amount > 0) {
        try {
          const hospitalId = req.user?.hospital_id || null;

          // Get consultation fee from hospital-scoped settings
          const settings = await Bill.getSettings(hospitalId);
          const consultationFee = settings.consultation_fee;

          // Create bill
          const [billResult] = await db.query(
            `INSERT INTO bills (patient_id, queue_id, consultation_fee, total_amount, final_amount, payment_status, created_by, hospital_id) 
             VALUES (?, ?, ?, ?, ?, 'paid', ?, ?)`,
            [patient.id, queueData.id, consultationFee, consultationFee, consultationFee, req.user.id, hospitalId]
          );

          const billId = billResult.insertId;

          // Add consultation fee as bill item
          await db.query(
            `INSERT INTO bill_items (bill_id, queue_id, item_type, description, amount, subtotal)
             VALUES (?, ?, 'consultation', 'Consultation Fee', ?, ?)`,
            [billId, queueData.id, consultationFee, consultationFee]
          );

          // Record payment (hospital-scoped receipt generation lives in Bill.addPayment)
          const paymentResult = await Bill.addPayment(billId, {
            amount: payment.amount,
            payment_method: payment.payment_method,
            reference_number: payment.reference || null,
            received_by: req.user.id
          });

          billData = { id: billId, amount: consultationFee };
          paymentData = {
            receipt_number: paymentResult.receiptNumber,
            method: payment.payment_method,
            amount: payment.amount
          };

        } catch (paymentError) {
          console.error("Payment processing error:", paymentError);
          // Continue with visit creation even if payment recording fails
        }
      }

      // Log visit creation to audit trail
      await auditLogger.logCreate(req, 'visit', queueData.id,
        `Created new visit for patient: ${patient.name} (${patient.patient_number})${payment ? ' with consultation fee payment' : ''}`,
        { patient_id: patient.id, queue: targetQueue, reason: reason || null, payment: payment?.payment_method }
      );

      res.status(201).json({
        success: true,
        message: `New visit created. Patient added to ${targetQueue} queue`,
        patient: {
          id: patient.id,
          patient_number: patient.patient_number,
          name: patient.name
        },
        queue: queueData,
        reason: reason || null,
        bill: billData,
        payment: paymentData
      });

    } catch (error) {
      console.error("Create visit error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create visit"
      });
    }
  }
};

module.exports = patientController;