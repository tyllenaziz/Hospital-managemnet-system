const Prescription = require("../models/Prescription");
const Medicine = require("../models/Medicine");
const Queue = require("../models/Queue");
const db = require("../config/dbconfig");
const auditLogger = require("../utils/auditLogger");

const prescriptionController = {
  // Doctor creates prescription
  create: async (req, res) => {
    try {
      const { queue_id, patient_id, notes, diagnosis, items, nextDepartment } = req.body;
      const doctor_id = req.user.id;

      if (!queue_id || !patient_id || !items || items.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const prescriptionData = {
        queue_id,
        patient_id,
        doctor_id,
        notes,
        diagnosis,
        items,
        hospital_id: req.user.hospital_id
      };

      const prescription = await Prescription.create(prescriptionData);

      // Log prescription creation to audit trail
      await auditLogger.logCreate(req, 'prescription', prescription.id,
        `Created prescription for patient ID ${patient_id} with ${items.length} item(s)`,
        { patient_id, diagnosis, items_count: items.length }
      );

      // Update queue status and transfer to pharmacy
      if (nextDepartment === 'pharmacy') {
        await Queue.transferToNextDepartment(queue_id, patient_id, 'pharmacy');

        res.json({
          success: true,
          message: "Prescription created and patient sent to pharmacy",
          prescription
        });
      } else {
        res.json({ success: true, prescription });
      }
    } catch (error) {
      console.error("âŒ Prescription creation error:", error);
      res.status(500).json({ error: "Failed to create prescription", details: error.message });
    }
  },

  // Get prescription by ID
  getById: async (req, res) => {
    try {
      const prescription = await Prescription.getById(req.params.id, req.user.hospital_id);

      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      res.json(prescription);
    } catch (error) {
      console.error("Get prescription error:", error);
      res.status(500).json({ error: "Failed to fetch prescription" });
    }
  },

  // Get all prescriptions (for doctors and pharmacists)
  getAll: async (req, res) => {
    try {
      const { status, patient_id, doctor_id, page = 1, limit = 20 } = req.query;
      const userRole = req.user.role;
      const userId = req.user.id;

      let filters = {};

      // Apply filters based on query parameters
      if (status) filters.status = status;
      if (patient_id) filters.patient_id = patient_id;
      if (doctor_id) filters.doctor_id = doctor_id;

      // Role-based filtering
      if (req.user.hospital_id) {
        filters.hospital_id = req.user.hospital_id;
      }

      if (userRole === 'doctor') {
        filters.doctor_id = userId; // Doctors can only see their own prescriptions
      }

      const results = await Prescription.getAll(filters, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        prescriptions: results.prescriptions,
        total: results.total,
        page: parseInt(page),
        totalPages: Math.ceil(results.total / parseInt(limit))
      });
    } catch (error) {
      console.error("âŒ Get all prescriptions error:", error);
      res.status(500).json({ error: "Failed to fetch prescriptions" });
    }
  },

  // Get prescriptions by doctor ID
  getByDoctor: async (req, res) => {
    try {
      const doctorId = req.params.doctorId || req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      let filters = { doctor_id: doctorId };
      if (req.user.hospital_id) filters.hospital_id = req.user.hospital_id;
      if (status) filters.status = status;

      const results = await Prescription.getAll(filters, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        prescriptions: results.prescriptions,
        total: results.total,
        page: parseInt(page),
        totalPages: Math.ceil(results.total / parseInt(limit))
      });
    } catch (error) {
      console.error("âŒ Get doctor prescriptions error:", error);
      res.status(500).json({ error: "Failed to fetch doctor prescriptions" });
    }
  },

  // Get prescriptions by patient ID
  getByPatient: async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const { status, page = 1, limit = 20 } = req.query;

      let filters = { patient_id: patientId };
      if (req.user.hospital_id) filters.hospital_id = req.user.hospital_id;
      if (status) filters.status = status;

      const results = await Prescription.getAll(filters, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        prescriptions: results.prescriptions,
        total: results.total,
        page: parseInt(page),
        totalPages: Math.ceil(results.total / parseInt(limit))
      });
    } catch (error) {
      console.error("âŒ Get patient prescriptions error:", error);
      res.status(500).json({ error: "Failed to fetch patient prescriptions" });
    }
  },

  // Get pending prescriptions (for pharmacy)
  getPending: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const filters = { status: 'pending' };
      if (req.user.hospital_id) filters.hospital_id = req.user.hospital_id;
      const results = await Prescription.getAll(filters, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        prescriptions: results.prescriptions,
        total: results.total,
        page: parseInt(page),
        totalPages: Math.ceil(results.total / parseInt(limit))
      });
    } catch (error) {
      console.error("âŒ Get pending prescriptions error:", error);
      res.status(500).json({ error: "Failed to fetch pending prescriptions" });
    }
  },

  // Get dispensed prescriptions (for pharmacy records)
  getDispensed: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const filters = { status: 'dispensed' };
      if (req.user.hospital_id) filters.hospital_id = req.user.hospital_id;
      const results = await Prescription.getAll(filters, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        prescriptions: results.prescriptions,
        total: results.total,
        page: parseInt(page),
        totalPages: Math.ceil(results.total / parseInt(limit))
      });
    } catch (error) {
      console.error("âŒ Get dispensed prescriptions error:", error);
      res.status(500).json({ error: "Failed to fetch dispensed prescriptions" });
    }
  },

  // Pharmacist dispenses medicine (with barcode scanning)
  dispense: async (req, res) => {
    const connection = await db.getConnection();

    try {
      const { prescriptionId } = req.params;
      const { items, payment_method } = req.body;
      const pharmacist_id = req.user.id;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "No items to dispense" });
      }

      // Get prescription details - use transaction connection
      const prescription = await Prescription.getById(prescriptionId);

      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      if (prescription.status !== 'pending') {
        return res.status(400).json({ error: "Prescription already dispensed or cancelled" });
      }

      await connection.beginTransaction();

      let totalAmount = 0;
      const saleItems = [];

      // Process each scanned item
      for (const item of items) {
        // Use transaction connection for all database operations
        const medicineSql = "SELECT * FROM medicines WHERE barcode = ?";
        const [medicineResults] = await connection.query(medicineSql, [item.barcode]);
        const medicine = medicineResults[0];

        if (!medicine) {
          await connection.rollback();
          return res.status(404).json({ error: `Medicine with barcode ${item.barcode} not found` });
        }


        // Check stock
        if (medicine.stock < item.quantity) {
          await connection.rollback();
          return res.status(400).json({ error: `Insufficient stock for ${medicine.name}` });
        }

        const subtotal = medicine.price * item.quantity;
        totalAmount += subtotal;

        saleItems.push({
          medicine_id: medicine.id,
          quantity: item.quantity,
          unit_price: medicine.price,
          subtotal
        });


        const updateSql = "UPDATE medicines SET stock = stock - ? WHERE id = ? AND stock >= ?";
        const updateParams = [item.quantity, medicine.id, item.quantity];

        const [updateResult] = await connection.query(updateSql, updateParams);

        if (updateResult.affectedRows === 0) {
          await connection.rollback();
          throw new Error(`Insufficient stock for medicine ${medicine.name}`);
        }


      }

      // Create sale record
      const saleSql = "INSERT INTO sales (prescription_id, pharmacist_id, total_amount, payment_method, hospital_id) VALUES (?, ?, ?, ?, ?)";
      const [saleResult] = await connection.query(saleSql, [
        prescriptionId,
        pharmacist_id,
        totalAmount,
        payment_method || 'cash',
        req.user.hospital_id
      ]);
      const saleId = saleResult.insertId;

      // Insert sale items
      const itemsSql = "INSERT INTO sales_items (sale_id, medicine_id, quantity, unit_price, subtotal) VALUES ?";
      const itemValues = saleItems.map(item => [
        saleId,
        item.medicine_id,
        item.quantity,
        item.unit_price,
        item.subtotal
      ]);

      await connection.query(itemsSql, [itemValues]);

      // Update prescription status using transaction connection
      await connection.query(
        "UPDATE prescriptions SET status = ? WHERE id = ?",
        ['dispensed', prescriptionId]
      );

      await connection.commit();

      // Log medicine dispensing to audit trail
      await auditLogger.logDispense(req, prescriptionId,
        `Dispensed ${saleItems.length} medicine(s) for prescription #${prescriptionId}, total: KES ${totalAmount}`,
        { saleId, totalAmount, items_count: saleItems.length, payment_method: payment_method || 'cash' }
      );

      res.json({
        success: true,
        message: "Medicine dispensed successfully",
        saleId,
        totalAmount,
        items: saleItems
      });
    } catch (error) {
      await connection.rollback();
      console.error("Dispense error:", error);
      res.status(500).json({
        error: "Failed to dispense medicine",
        details: error.message
      });
    } finally {
      connection.release();
    }
  },
  // Get prescription statistics
  getStats: async (req, res) => {
    try {
      const userRole = req.user.role;
      const userId = req.user.id;

      let statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'dispensed' THEN 1 ELSE 0 END) as dispensed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM prescriptions
      `;

      const queryParams = [];

      if (userRole === 'doctor') {
        statsQuery += ' WHERE doctor_id = ?';
        queryParams.push(userId);
      } else if (req.user.hospital_id) {
        statsQuery += ' WHERE hospital_id = ?';
        queryParams.push(req.user.hospital_id);
      }

      const [results] = await db.query(statsQuery, queryParams);

      res.json({
        success: true,
        stats: results[0] || { total: 0, pending: 0, dispensed: 0, cancelled: 0 }
      });
    } catch (error) {
      console.error("âŒ Get prescription stats error:", error);
      res.status(500).json({ error: "Failed to fetch prescription statistics" });
    }
  },

  // Get prescription by queue ID
  getByQueueId: async (req, res) => {
    try {
      const { queueId } = req.params;

      const sql = `
        SELECT p.*, u.username as doctor_name,
              pi.id as item_id, pi.medicine_id, pi.custom_medicine_name,
              m.name as medicine_name,
              pi.quantity, pi.dosage, pi.duration, pi.instructions, m.price
        FROM prescriptions p
        LEFT JOIN users u ON p.doctor_id = u.id
        LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
        LEFT JOIN medicines m ON pi.medicine_id = m.id
        WHERE p.queue_id = ? AND p.hospital_id = ?
      `;

      const [results] = await db.query(sql, [queueId, req.user.hospital_id]);

      if (results.length === 0) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      const prescription = {
        id: results[0].id,
        queue_id: results[0].queue_id,
        patient_id: results[0].patient_id,
        doctor_id: results[0].doctor_id,
        doctor_name: results[0].doctor_name,
        notes: results[0].notes,
        diagnosis: results[0].diagnosis,
        created_at: results[0].created_at,
        items: results.filter(r => r.item_id).map(r => ({
          id: r.item_id,
          medicine_id: r.medicine_id,
          medicine_name: r.medicine_name || r.custom_medicine_name,  // Use custom name if no inventory medicine
          custom_medicine_name: r.custom_medicine_name,
          quantity: r.quantity,
          dosage: r.dosage,
          duration: r.duration,
          instructions: r.instructions,
          price: r.price
        }))
      };

      res.json(prescription);
    } catch (error) {
      console.error('Get prescription by queue error:', error);
      res.status(500).json({ error: "Failed to fetch prescription" });
    }
  },


  getLatestByPatient: async (req, res) => {
    try {
      const { patientId } = req.params;

      // First get the latest prescription
      const prescriptionSql = `
        SELECT p.*, u.username as doctor_name
        FROM prescriptions p
        LEFT JOIN users u ON p.doctor_id = u.id
        WHERE p.patient_id = ? AND p.status = 'pending' AND p.hospital_id = ?
        ORDER BY p.created_at DESC
        LIMIT 1
      `;

      const [prescriptionResults] = await db.query(prescriptionSql, [patientId, req.user.hospital_id]);

      if (!prescriptionResults || prescriptionResults.length === 0) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      const prescriptionId = prescriptionResults[0].id;


      // Then get all items for this prescription
      const itemsSql = `
        SELECT 
          pi.id,
          pi.medicine_id,
          pi.custom_medicine_name,
          m.name as medicine_name,
          pi.quantity,
          pi.dosage,
          pi.duration,
          pi.instructions,
          m.price
        FROM prescription_items pi
        LEFT JOIN medicines m ON pi.medicine_id = m.id
        WHERE pi.prescription_id = ?
      `;

      const [itemsResults] = await db.query(itemsSql, [prescriptionId]);


      // Map items to use custom name if no inventory medicine
      const items = itemsResults.map(item => ({
        id: item.id,
        medicine_id: item.medicine_id,
        medicine_name: item.medicine_name || item.custom_medicine_name,
        custom_medicine_name: item.custom_medicine_name,
        quantity: item.quantity,
        dosage: item.dosage,
        duration: item.duration,
        instructions: item.instructions,
        price: item.price
      }));

      const prescription = {
        id: prescriptionResults[0].id,
        queue_id: prescriptionResults[0].queue_id,
        patient_id: prescriptionResults[0].patient_id,
        doctor_id: prescriptionResults[0].doctor_id,
        doctor_name: prescriptionResults[0].doctor_name,
        notes: prescriptionResults[0].notes,
        diagnosis: prescriptionResults[0].diagnosis,
        status: prescriptionResults[0].status,
        created_at: prescriptionResults[0].created_at,
        items: items
      };

      res.json(prescription);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: "Database error", details: error.message });
    }
  },


  getReceipt: async (req, res) => {
    try {
      const { prescriptionId } = req.params;
      const hospitalId = req.user.hospital_id;

      // Step 0: Get hospital info for receipt branding
      let hospitalInfo = null;
      if (hospitalId) {
        const [hospitalResults] = await db.query(
          `SELECT name, code, logo_path, address, city, county, country,
                  phone, alternative_phone, email, website, license_number, tax_pin
           FROM hospitals WHERE id = ?`,
          [hospitalId]
        );
        if (hospitalResults.length > 0) {
          hospitalInfo = hospitalResults[0];
        }
      }

      // Step 1: Get the prescription to extract patient_id
      const prescriptionSql = `
      SELECT 
        p.*,
        pt.name as patient_name,
        pt.phone as patient_phone,
        pt.patient_number,
        pt.age,
        pt.gender,
        u.username as doctor_name,
        p.patient_id
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN users u ON p.doctor_id = u.id
      WHERE p.id = ?
    `;

      const [prescriptionResults] = await db.query(prescriptionSql, [prescriptionId]);
      if (!prescriptionResults || prescriptionResults.length === 0) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      const prescription = prescriptionResults[0];

      // Check if prescription is dispensed
      if (prescription.status !== 'dispensed') {
        return res.status(400).json({ error: "Prescription not yet dispensed" });
      }

      // Step 2: Get the bill using patient_id
      const billSql = `
      SELECT 
        b.id AS bill_id,
        b.consultation_fee,
        b.lab_fee,
        b.pharmacy_fee,
        b.total_amount,
        b.discount,
        b.final_amount,
        b.payment_status,
        b.payment_method,
        b.created_at,
        b.created_by as pharmacist_id
      FROM bills b
      WHERE b.patient_id = ?
      ORDER BY b.created_at DESC
      LIMIT 1
    `;

      const [billResults] = await db.query(billSql, [prescription.patient_id]);
      if (!billResults || billResults.length === 0) {
        return res.status(404).json({ error: "Bill not found for this patient" });
      }

      const bill = billResults[0];
      const pharmacistId = bill.pharmacist_id;

      // Step 3: Get pharmacist information
      let pharmacist = null;
      if (pharmacistId) {
        const pharmacistSql = `
        SELECT 
          id,
          username as pharmacist_name,
          phone as pharmacist_phone,
          role
        FROM users 
        WHERE id = ? AND role = 'pharmacy'
      `;
        const [pharmacistResults] = await db.query(pharmacistSql, [pharmacistId]);
        if (pharmacistResults && pharmacistResults.length > 0) {
          pharmacist = {
            id: pharmacistResults[0].id,
            name: pharmacistResults[0].pharmacist_name,
            phone: pharmacistResults[0].pharmacist_phone,
            role: pharmacistResults[0].role
          };
        }
      }

      // Step 4: Get ALL bill items (consultation, lab tests, medicines)
      const billItemsSql = `
      SELECT 
        bi.id as item_id,
        bi.item_type,
        bi.item_id as reference_id,
        bi.description,
        bi.quantity,
        bi.unit_price,
        bi.subtotal,
        bi.medicine_id,
        bi.custom_medicine_name
      FROM bill_items bi
      WHERE bi.bill_id = ?
      ORDER BY 
        CASE bi.item_type
          WHEN 'consultation' THEN 1
          WHEN 'lab_test' THEN 2
          WHEN 'medicine' THEN 3
          ELSE 4
        END,
        bi.id
    `;

      const [billItemsResults] = await db.query(billItemsSql, [bill.bill_id]);


      // Step 5: Get prescription items for medicine details (dosage, duration, instructions)
      const prescriptionItemsSql = `
      SELECT 
        pi.id,
        pi.medicine_id,
        pi.custom_medicine_name,
        m.name as medicine_name,
        pi.quantity,
        pi.dosage,
        pi.duration,
        pi.instructions
      FROM prescription_items pi
      LEFT JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.prescription_id = ?
    `;

      const [prescriptionItemsResults] = await db.query(prescriptionItemsSql, [prescriptionId]);


      // Create a map of prescription items for easy lookup
      const prescriptionItemsMap = new Map();
      prescriptionItemsResults.forEach(item => {
        // Create keys for both medicine_id and custom_medicine_name
        if (item.medicine_id) {
          prescriptionItemsMap.set(`med_${item.medicine_id}`, item);
        }
        if (item.custom_medicine_name) {
          prescriptionItemsMap.set(`custom_${item.custom_medicine_name}`, item);
        }
        // Also map by medicine name for fallback
        const medicineName = item.medicine_name || item.custom_medicine_name;
        if (medicineName) {
          prescriptionItemsMap.set(`name_${medicineName.toLowerCase()}`, item);
        }
      });

      // Step 6: Build the complete items array with all bill items
      const items = billItemsResults.map(billItem => {
        const baseItem = {
          item_id: billItem.item_id,
          type: billItem.item_type || 'medicine', // Default to medicine if type is empty
          description: billItem.description,
          quantity: billItem.quantity,
          unit_price: parseFloat(billItem.unit_price) || 0,
          subtotal: parseFloat(billItem.subtotal) || 0
        };

        // If it's a medicine, add prescription details
        if (billItem.item_type === 'medicine' || !billItem.item_type) {
          let prescriptionItem = null;

          // Try to find matching prescription item
          if (billItem.medicine_id) {
            prescriptionItem = prescriptionItemsMap.get(`med_${billItem.medicine_id}`);
          }

          if (!prescriptionItem && billItem.custom_medicine_name) {
            prescriptionItem = prescriptionItemsMap.get(`custom_${billItem.custom_medicine_name}`);
          }

          if (!prescriptionItem && billItem.description) {
            prescriptionItem = prescriptionItemsMap.get(`name_${billItem.description.toLowerCase()}`);
          }

          if (prescriptionItem) {
            baseItem.medicine_id = prescriptionItem.medicine_id;
            baseItem.medicine_name = prescriptionItem.medicine_name || prescriptionItem.custom_medicine_name;
            baseItem.custom_medicine_name = prescriptionItem.custom_medicine_name;
            baseItem.dosage = prescriptionItem.dosage;
            baseItem.duration = prescriptionItem.duration;
            baseItem.instructions = prescriptionItem.instructions;
          } else {
            // Fallback if no prescription item found
            baseItem.medicine_name = billItem.description || billItem.custom_medicine_name || 'Unknown Medicine';
            baseItem.custom_medicine_name = billItem.custom_medicine_name;
            baseItem.medicine_id = billItem.medicine_id;
          }
        }

        return baseItem;
      });


      // Step 7: Calculate summary
      const summary = {
        consultation_fee: parseFloat(bill.consultation_fee) || 0,
        lab_fee: parseFloat(bill.lab_fee) || 0,
        pharmacy_fee: parseFloat(bill.pharmacy_fee) || 0,
        subtotal: parseFloat(bill.total_amount) || 0,
        discount: parseFloat(bill.discount) || 0,
        final_amount: parseFloat(bill.final_amount) || 0,
        items_count: items.length,
        calculated_total: items.reduce((sum, item) => sum + item.subtotal, 0)
      };

      // Step 8: Build the complete receipt object
      const receipt = {
        id: prescription.id,
        prescription_id: prescription.id,
        bill_id: bill.bill_id,
        patient_name: prescription.patient_name,
        patient_phone: prescription.patient_phone,
        patient_number: prescription.patient_number,
        age: prescription.age,
        gender: prescription.gender,
        doctor_name: prescription.doctor_name,
        notes: prescription.notes,
        consultation_fee: summary.consultation_fee,
        lab_fee: summary.lab_fee,
        pharmacy_fee: summary.pharmacy_fee,
        subtotal: summary.subtotal,
        discount: summary.discount,
        total_amount: summary.final_amount,
        payment_status: bill.payment_status,
        payment_method: bill.payment_method,
        created_at: prescription.created_at,
        updated_at: prescription.updated_at,
        served_by: pharmacist,
        items: items,
        summary: summary,
        hospital: hospitalInfo
      };

      res.json(receipt);

    } catch (error) {
      console.error('âŒ Error fetching receipt:', error);
      res.status(500).json({
        error: "Failed to fetch receipt",
        details: error.message
      });
    }
  },
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      await Prescription.updateStatus(id, status, req.user.hospital_id);

      res.json({ success: true, message: "Prescription status updated" });
    } catch (error) {
      console.error("Error updating prescription status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  }
};

module.exports = prescriptionController;
