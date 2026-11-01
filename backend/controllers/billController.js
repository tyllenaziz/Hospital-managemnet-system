const Bill = require("../models/Bill");
const db = require('../config/dbconfig.js');
const auditLogger = require("../utils/auditLogger");

const billController = {
  create: async (req, res) => {
    try {
      const { patient_id, queue_id, consultation_fee } = req.body;
      const created_by = req.user.id;
      const hospital_id = req.user.hospital_id;

      if (!patient_id) {
        return res.status(400).json({ error: "Patient ID is required" });
      }

      const bill = await Bill.create({ patient_id, queue_id, created_by, consultation_fee, hospital_id });

      // Log bill creation to audit trail
      await auditLogger.logCreate(req, 'bill', bill.id,
        `Created bill for patient ID ${patient_id}`,
        { patient_id, queue_id, consultation_fee, hospital_id }
      );

      res.json({ success: true, bill });
    } catch (error) {
      console.error("❌ Bill creation error:", error);
      res.status(500).json({ error: "Failed to create bill", details: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const hospitalId = req.user.hospital_id;
      let sql = `
      SELECT 
        p.id as patient_id,
        p.patient_number,
        p.name as patient_name,
        p.phone,
        COUNT(b.id) as total_bills,
        -- Calculate total correctly: one consultation + sum of all lab and pharmacy fees
        (
          MAX(b.consultation_fee) + 
          SUM(b.lab_fee) + 
          SUM(b.pharmacy_fee)
        ) as total_amount,
        -- Pending amount: consultation + pending lab/pharmacy fees
        (
          CASE WHEN SUM(CASE WHEN b.payment_status = 'pending' THEN 1 ELSE 0 END) > 0 
               THEN MAX(b.consultation_fee) 
               ELSE 0 
          END +
          SUM(CASE WHEN b.payment_status = 'pending' THEN (b.lab_fee + b.pharmacy_fee) ELSE 0 END)
        ) as pending_amount,
        -- Paid amount: consultation + paid lab/pharmacy fees
        (
          CASE WHEN SUM(CASE WHEN b.payment_status = 'paid' THEN 1 ELSE 0 END) > 0 
               THEN MAX(b.consultation_fee) 
               ELSE 0 
          END +
          SUM(CASE WHEN b.payment_status = 'paid' THEN (b.lab_fee + b.pharmacy_fee) ELSE 0 END)
        ) as paid_amount,
        -- Partial amount: consultation + partial lab/pharmacy fees
        (
          CASE WHEN SUM(CASE WHEN b.payment_status = 'partial' THEN 1 ELSE 0 END) > 0 
               THEN MAX(b.consultation_fee) 
               ELSE 0 
          END +
          SUM(CASE WHEN b.payment_status = 'partial' THEN (b.lab_fee + b.pharmacy_fee) ELSE 0 END)
        ) as partial_amount,
        MAX(b.created_at) as last_bill_date,
        GROUP_CONCAT(DISTINCT b.id ORDER BY b.id DESC) as bill_ids
      FROM patients p
      JOIN bills b ON p.id = b.patient_id
      WHERE 1=1
    `;

      const params = [];
      if (hospitalId) {
        sql += " AND b.hospital_id = ?";
        params.push(hospitalId);
      }

      sql += `
      GROUP BY p.id, p.name, p.phone
      ORDER BY last_bill_date DESC
      `;

      const [results] = await db.query(sql, params);

      res.json({
        success: true,
        patients: results
      });
    } catch (error) {
      console.error("Get bills error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch bills"
      });
    }
  },

  getById: async (req, res) => {
    try {
      const bill = await Bill.getById(req.params.id);

      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }

      res.json(bill);
    } catch (error) {
      console.error("Get bill error:", error);
      res.status(500).json({ error: "Failed to fetch bill" });
    }
  },

  getByPatient: async (req, res) => {
    try {
      const { patientId } = req.params;
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

      // Step 1: Get all bills for the patient with doctor information
      let billsSql = `
        SELECT 
          b.*, 
          p.name as patient_name,
          p.phone,
          p.patient_number,
          p.age,
          p.gender,
          u.username as created_by_name,
          COALESCE(doc.username, q_doc.username, u.username) as doctor_name,
          DATE(b.created_at) as visit_date
        FROM bills b
        JOIN patients p ON b.patient_id = p.id
        LEFT JOIN users u ON b.created_by = u.id
        LEFT JOIN queue q ON b.queue_id = q.id
        LEFT JOIN prescriptions pr ON pr.queue_id = b.queue_id
        LEFT JOIN users doc ON pr.doctor_id = doc.id
        LEFT JOIN users q_doc ON q.assigned_to = q_doc.id
        WHERE b.patient_id = ?
      `;

      const params = [patientId];
      if (req.user.hospital_id) {
        billsSql += " AND b.hospital_id = ?";
        params.push(req.user.hospital_id);
      }

      billsSql += `
        GROUP BY b.id
        ORDER BY b.created_at DESC
      `;

      const [bills] = await db.query(billsSql, params);

      if (!bills || bills.length === 0) {
        return res.json({
          success: true,
          bills: [],
          visits: []
        });
      }

      // Step 2: Get all bill items for all bills
      const billIds = bills.map(b => b.id);
      const placeholders = billIds.map(() => '?').join(',');

      const billItemsSql = `
        SELECT 
          bi.id as item_id,
          bi.bill_id,
          bi.item_type,
          bi.item_id as reference_id,
          bi.description,
          bi.quantity,
          bi.unit_price,
          bi.subtotal,
          bi.medicine_id,
          bi.custom_medicine_name
        FROM bill_items bi
        WHERE bi.bill_id IN (${placeholders})
        ORDER BY bi.bill_id, bi.id
      `;

      const [billItems] = await db.query(billItemsSql, billIds);

      // Step 3: Group bill items by bill_id
      const billItemsByBillId = new Map();
      billItems.forEach(item => {
        if (!billItemsByBillId.has(item.bill_id)) {
          billItemsByBillId.set(item.bill_id, []);
        }
        billItemsByBillId.get(item.bill_id).push({
          item_id: item.item_id,
          type: item.item_type || 'medicine',
          description: item.description,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price) || 0,
          subtotal: parseFloat(item.subtotal) || 0,
          medicine_id: item.medicine_id,
          custom_medicine_name: item.custom_medicine_name
        });
      });

      // Step 4: Consolidate bills by visit date
      const visitMap = new Map();

      bills.forEach(bill => {
        // Convert visit_date to YYYY-MM-DD string for consistent comparison
        const visitDateObj = new Date(bill.visit_date || bill.created_at);
        const visitDateKey = visitDateObj.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!visitMap.has(visitDateKey)) {
          visitMap.set(visitDateKey, {
            visit_date: visitDateKey,
            patient_id: bill.patient_id,
            patient_name: bill.patient_name,
            patient_number: bill.patient_number,
            phone: bill.phone,
            age: bill.age,
            gender: bill.gender,
            doctor_name: bill.doctor_name,
            created_by_name: bill.created_by_name,
            bill_ids: [],
            consultation_fee: 0, // Only count once per visit
            lab_fee: 0,
            pharmacy_fee: 0,
            discount: 0,
            items: [],
            payment_status: 'paid', // Will check all bills
            created_at: bill.created_at
          });
        }

        const visit = visitMap.get(visitDateKey);
        visit.bill_ids.push(bill.id);

        // Only add consultation fee once (from first bill in visit)
        if (visit.consultation_fee === 0) {
          visit.consultation_fee = parseFloat(bill.consultation_fee) || 0;
        }

        // Add lab and pharmacy fees (these can accumulate)
        visit.lab_fee += parseFloat(bill.lab_fee) || 0;
        visit.pharmacy_fee += parseFloat(bill.pharmacy_fee) || 0;
        visit.discount += parseFloat(bill.discount) || 0;

        // Add items from this bill (skip duplicate consultations)
        const billItemsList = billItemsByBillId.get(bill.id) || [];
        billItemsList.forEach(item => {
          // Skip consultation items if we already have one
          if (item.type === 'consultation' && visit.items.some(i => i.type === 'consultation')) {
            return;
          }
          visit.items.push(item);
        });

        // If any bill is pending/partial, the whole visit is pending
        if (bill.payment_status === 'pending' || bill.payment_status === 'partial') {
          visit.payment_status = 'pending';
        }
      });

      // Step 5: Build consolidated visit bills
      const consolidatedBills = Array.from(visitMap.values()).map(visit => {
        const total_amount = visit.consultation_fee + visit.lab_fee + visit.pharmacy_fee;
        const final_amount = total_amount - visit.discount;

        return {
          id: visit.bill_ids.join(','), // Combined bill IDs
          bill_ids: visit.bill_ids,
          patient_id: visit.patient_id,
          patient_name: visit.patient_name,
          patient_number: visit.patient_number,
          phone: visit.phone,
          age: visit.age,
          gender: visit.gender,
          visit_date: visit.visit_date,
          consultation_fee: visit.consultation_fee,
          lab_fee: visit.lab_fee,
          pharmacy_fee: visit.pharmacy_fee,
          total_amount: total_amount,
          discount: visit.discount,
          final_amount: final_amount,
          payment_status: visit.payment_status,
          doctor_name: visit.doctor_name,
          created_by_name: visit.created_by_name,
          created_at: visit.created_at,
          items: visit.items,
          summary: {
            consultation_fee: visit.consultation_fee,
            lab_fee: visit.lab_fee,
            pharmacy_fee: visit.pharmacy_fee,
            subtotal: total_amount,
            discount: visit.discount,
            final_amount: final_amount,
            items_count: visit.items.length,
            calculated_total: visit.items.reduce((sum, item) => sum + item.subtotal, 0)
          }
        };
      });

      // Sort by date descending
      consolidatedBills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.json({
        success: true,
        bills: consolidatedBills,
        hospital: hospitalInfo
      });

    } catch (error) {
      console.error("Get bills error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch bills",
        details: error.message
      });
    }
  },

  getPending: async (req, res) => {
    try {
      const hospitalId = req.user.hospital_id;
      const bills = await Bill.getPending(hospitalId);
      res.json(bills);
    } catch (error) {
      console.error("Get pending bills error:", error);
      res.status(500).json({ error: "Failed to fetch pending bills" });
    }
  },

  addLabTests: async (req, res) => {
    try {
      const { billId } = req.params;
      const { lab_order_id } = req.body;

      if (!lab_order_id) {
        return res.status(400).json({ error: "Lab order ID is required" });
      }

      await Bill.addLabTests(billId, lab_order_id);

      res.json({ success: true, message: "Lab tests added to bill" });
    } catch (error) {
      console.error("❌ Error adding lab tests to bill:", error);
      res.status(500).json({ error: "Failed to add lab tests", details: error.message });
    }
  },

  addMedicines: async (req, res) => {
    try {
      const { billId } = req.params;
      const { prescription_id, custom_items } = req.body;

      if (!prescription_id) {
        return res.status(400).json({ error: "Prescription ID is required" });
      }

      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        let totalAmount = 0;

        // If custom_items provided (with quantities and total prices)
        if (custom_items && custom_items.length > 0) {
          for (const item of custom_items) {
            if (item.quantity > 0) {
              const subtotal = item.total_price;
              totalAmount += subtotal;

              // Calculate unit_price for storage
              const unitPrice = item.medicine_id && item.quantity > 0
                ? (item.total_price / item.quantity)
                : 0;

              // Determine item type
              const itemType = item.medicine_id ? 'medicine' : 'custom_medicine';

              // Insert bill item with correct type
              const itemSql = `
              INSERT INTO bill_items 
              (bill_id, item_type, medicine_id, custom_medicine_name, quantity, unit_price, subtotal)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

              await connection.query(itemSql, [
                billId,
                itemType, // This was missing - now setting correct type
                item.medicine_id || null,
                item.custom_medicine_name || null,
                item.quantity,
                unitPrice,
                subtotal
              ]);
            }
          }

          // Update bill total
          const updateBillSql = `
          UPDATE bills 
          SET pharmacy_fee = COALESCE(pharmacy_fee, 0) + ?, 
              total_amount = COALESCE(total_amount, 0) + ?,
              final_amount = COALESCE(final_amount, 0) + ?
          WHERE id = ?
        `;
          await connection.query(updateBillSql, [totalAmount, totalAmount, totalAmount, billId]);

          await connection.commit();
          res.json({ success: true, message: "Medicines added to bill" });
        } else {
          // Original logic without custom items
          await connection.rollback();
          return res.status(400).json({
            error: "custom_items array is required with quantities and prices"
          });
        }
      } catch (error) {
        await connection.rollback();
        console.error("Transaction error:", error);
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("❌ Error adding medicines to bill:", error);
      res.status(500).json({
        error: "Failed to add medicines",
        details: error.message,
        sqlMessage: error.sqlMessage
      });
    }
  },

  addPayment: async (req, res) => {
    try {
      const { billId } = req.params;
      const { amount, payment_method, reference_number } = req.body;
      const received_by = req.user.id;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid payment amount is required" });
      }

      const paymentData = {
        amount,
        payment_method: payment_method || 'cash',
        reference_number,
        received_by
      };

      const result = await Bill.addPayment(billId, paymentData);

      // Log payment to audit trail
      await auditLogger.logPayment(req, 'bill', billId,
        `Payment of KES ${amount} received for bill #${billId} via ${payment_method || 'cash'}`,
        { amount, payment_method: payment_method || 'cash', reference_number, paymentStatus: result.paymentStatus }
      );

      res.json({
        success: true,
        message: "Payment received",
        paymentStatus: result.paymentStatus,
        totalPaid: result.totalPaid,
        receiptNumber: result.receiptNumber
      });
    } catch (error) {
      console.error("❌ Payment error:", error);
      res.status(500).json({ error: "Payment failed", details: error.message });
    }
  }
};

module.exports = billController;
