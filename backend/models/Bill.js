const db = require('../config/dbconfig.js');

const RECEIPT_PREFIX_KEY = 'receipt_prefix';
const RECEIPT_NEXT_KEY = 'receipt_next';

const formatReceiptNumber = (prefix, sequence) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sequencePart = String(sequence).padStart(6, '0');
  return `${prefix}-${datePart}-${sequencePart}`;
};

const Bill = {
  // Get system settings (consultation fee, etc.)
  getSettings: async (hospitalId = null) => {
    const sql = `
      SELECT *
      FROM system_settings
      WHERE setting_key = 'consultation_fee'
      AND (hospital_id = ? OR hospital_id IS NULL)
      ORDER BY hospital_id DESC
      LIMIT 1
    `;
    const [results] = await db.query(sql, [hospitalId]);

    if (results.length > 0) {
      return {
        consultation_fee: parseFloat(results[0].setting_value)
      };
    }

    // Default fallback if no settings found
    return { consultation_fee: 500 };
  },

  create: async (billData) => {
    const { patient_id, queue_id, created_by } = billData;

    // Get consultation fee from settings
    const settings = await Bill.getSettings(billData.hospital_id || null);
    const consultation_fee = settings.consultation_fee;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const sql = `
        INSERT INTO bills (patient_id, queue_id, consultation_fee, total_amount, final_amount, created_by, hospital_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.query(sql, [
        patient_id, queue_id, consultation_fee, consultation_fee, consultation_fee, created_by, billData.hospital_id
      ]);

      const billId = result.insertId;

      // Add consultation fee as bill item
      if (consultation_fee > 0) {
        const itemSql = `
          INSERT INTO bill_items (bill_id, item_type, item_id, description, quantity, unit_price, subtotal) 
          VALUES (?, 'consultation', ?, 'Doctor Consultation', 1, ?, ?)
        `;

        await connection.query(itemSql, [billId, queue_id, consultation_fee, consultation_fee]);
      }

      await connection.commit();
      return { id: billId, consultation_fee };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  addLabTests: async (billId, labOrderId) => {
    const sql = `
      SELECT loi.id as item_id, lt.id as test_id, lt.test_name, lt.price
      FROM lab_order_items loi
      JOIN lab_tests lt ON loi.lab_test_id = lt.id
      WHERE loi.lab_order_id = ?
    `;

    const [tests] = await db.query(sql, [labOrderId]);
    if (tests.length === 0) return;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      let labTotal = 0;
      const itemValues = tests.map(test => {
        labTotal += parseFloat(test.price);
        return [billId, 'lab_test', test.test_id, test.test_name, 1, test.price, test.price];
      });

      const itemSql = `
        INSERT INTO bill_items (bill_id, item_type, item_id, description, quantity, unit_price, subtotal) 
        VALUES ?
      `;

      await connection.query(itemSql, [itemValues]);

      const updateSql = `
        UPDATE bills 
        SET lab_fee = ?, 
            total_amount = consultation_fee + ? + pharmacy_fee,
            final_amount = consultation_fee + ? + pharmacy_fee - discount
        WHERE id = ?
      `;

      await connection.query(updateSql, [labTotal, labTotal, labTotal, billId]);

      await connection.commit();

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  addMedicines: async (billId, prescriptionId) => {
    const sql = `
      SELECT pi.id as item_id, m.id as medicine_id, m.name, m.price, pi.quantity
      FROM prescription_items pi
      JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.prescription_id = ?
    `;

    const [medicines] = await db.query(sql, [prescriptionId]);
    if (medicines.length === 0) return;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      let pharmacyTotal = 0;
      const itemValues = medicines.map(medicine => {
        const subtotal = parseFloat(medicine.price) * medicine.quantity;
        pharmacyTotal += subtotal;
        return [billId, 'medicine', medicine.medicine_id, medicine.name, medicine.quantity, medicine.price, subtotal];
      });

      const itemSql = `
        INSERT INTO bill_items (bill_id, item_type, item_id, description, quantity, unit_price, subtotal) 
        VALUES ?
      `;

      await connection.query(itemSql, [itemValues]);

      const updateSql = `
        UPDATE bills 
        SET pharmacy_fee = ?, 
            total_amount = consultation_fee + lab_fee + ?,
            final_amount = consultation_fee + lab_fee + ? - discount
        WHERE id = ?
      `;

      await connection.query(updateSql, [pharmacyTotal, pharmacyTotal, pharmacyTotal, billId]);

      await connection.commit();

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  getById: async (id) => {
    const sql = `
      SELECT b.*, 
             p.name as patient_name,
             p.phone,
             p.patient_number,
             u.username as created_by_name,
             bi.id as item_id,
             bi.item_type,
             bi.description,
             bi.quantity,
             bi.unit_price,
             bi.subtotal,
             h.name as hospital_name,
             h.code as hospital_code,
             h.logo_path as hospital_logo,
             h.address as hospital_address,
             h.city as hospital_city,
             h.county as hospital_county,
             h.country as hospital_country,
             h.phone as hospital_phone,
             h.alternative_phone as hospital_alt_phone,
             h.email as hospital_email,
             h.website as hospital_website,
             h.license_number as hospital_license,
             h.tax_pin as hospital_tax_pin
      FROM bills b
      JOIN patients p ON b.patient_id = p.id
      JOIN users u ON b.created_by = u.id
      LEFT JOIN bill_items bi ON b.id = bi.bill_id
      LEFT JOIN hospitals h ON b.hospital_id = h.id
      WHERE b.id = ?
    `;

    const [results] = await db.query(sql, [id]);
    if (results.length === 0) return null;

    // Extract hospital info from the first row
    const hospitalInfo = results[0].hospital_name ? {
      name: results[0].hospital_name,
      code: results[0].hospital_code,
      logo_path: results[0].hospital_logo,
      address: results[0].hospital_address,
      city: results[0].hospital_city,
      county: results[0].hospital_county,
      country: results[0].hospital_country,
      phone: results[0].hospital_phone,
      alternative_phone: results[0].hospital_alt_phone,
      email: results[0].hospital_email,
      website: results[0].hospital_website,
      license_number: results[0].hospital_license,
      tax_pin: results[0].hospital_tax_pin
    } : null;

    const bill = {
      id: results[0].id,
      patient_id: results[0].patient_id,
      patient_name: results[0].patient_name,
      phone: results[0].phone,
      patient_number: results[0].patient_number,
      queue_id: results[0].queue_id,
      consultation_fee: results[0].consultation_fee,
      lab_fee: results[0].lab_fee,
      pharmacy_fee: results[0].pharmacy_fee,
      total_amount: results[0].total_amount,
      discount: results[0].discount,
      final_amount: results[0].final_amount,
      payment_status: results[0].payment_status,
      payment_method: results[0].payment_method,
      created_by: results[0].created_by,
      created_by_name: results[0].created_by_name,
      created_at: results[0].created_at,
      hospital: hospitalInfo,
      items: []
    };

    results.forEach(row => {
      if (row.item_id) {
        bill.items.push({
          id: row.item_id,
          type: row.item_type,
          description: row.description,
          quantity: row.quantity,
          unit_price: row.unit_price,
          subtotal: row.subtotal
        });
      }
    });

    return bill;
  },

  // Add to Bill model
  getByQueueId: async (queueId, hospitalId) => {
    const sql = `
    SELECT b.*, 
           p.name as patient_name,
           p.phone,
           p.patient_number,
           u.username as created_by_name
    FROM bills b
    JOIN patients p ON b.patient_id = p.id
    JOIN users u ON b.created_by = u.id
    WHERE b.queue_id = ? AND b.hospital_id = ?
  `;

    const [results] = await db.query(sql, [queueId, hospitalId]);
    return results.length > 0 ? results[0] : null;
  },

  // Updated create function to handle existing bills
  createOrUpdate: async (billData) => {
    const { patient_id, queue_id, created_by, hospital_id } = billData;

    // Check if bill already exists for this queue
    const existingBill = await Bill.getByQueueId(queue_id, hospital_id);

    if (existingBill) {
      return existingBill; // Return existing bill instead of creating new one
    }

    // Get consultation fee from settings
    const settings = await Bill.getSettings(hospital_id || null);
    const consultation_fee = settings.consultation_fee;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const sql = `
      INSERT INTO bills (patient_id, queue_id, consultation_fee, total_amount, final_amount, created_by, hospital_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

      const [result] = await connection.query(sql, [
        patient_id, queue_id, consultation_fee, consultation_fee, consultation_fee, created_by, billData.hospital_id
      ]);

      const billId = result.insertId;

      // Add consultation fee as bill item
      if (consultation_fee > 0) {
        const itemSql = `
        INSERT INTO bill_items (bill_id, item_type, item_id, description, quantity, unit_price, subtotal) 
        VALUES (?, 'consultation', ?, 'Doctor Consultation', 1, ?, ?)
      `;

        await connection.query(itemSql, [billId, queue_id, consultation_fee, consultation_fee]);
      }

      await connection.commit();
      return { id: billId, consultation_fee };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },


  getByPatient: async (patientId, hospitalId = null) => {
    let sql = `
      SELECT b.*, 
             p.name as patient_name,
             p.phone,
             p.patient_number,
             u.username as created_by_name
      FROM bills b
      JOIN patients p ON b.patient_id = p.id
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.patient_id = ?
    `;
    const params = [patientId];

    if (hospitalId) {
      sql += " AND b.hospital_id = ?";
      params.push(hospitalId);
    }

    sql += " ORDER BY b.created_at DESC";

    const [results] = await db.query(sql, params);
    return results;
  },

  getPending: async (hospitalId = null) => {
    let sql = `
      SELECT b.*, p.name as patient_name, p.phone
      FROM bills b
      JOIN patients p ON b.patient_id = p.id
      WHERE b.payment_status IN ('pending', 'partial')
    `;
    const params = [];

    if (hospitalId) {
      sql += " AND b.hospital_id = ?";
      params.push(hospitalId);
    }

    sql += " ORDER BY b.created_at DESC";

    const [results] = await db.query(sql, params);
    return results;
  },

  addPayment: async (billId, paymentData) => {
    const { amount, payment_method, reference_number, received_by } = paymentData;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const billMetaSql = 'SELECT hospital_id FROM bills WHERE id = ? FOR UPDATE';
      const [billMeta] = await connection.query(billMetaSql, [billId]);

      if (billMeta.length === 0) {
        throw new Error('Bill not found');
      }

      const hospitalId = billMeta[0].hospital_id || null;

      let receiptNumber = reference_number || null;
      if (!receiptNumber) {
        if (!hospitalId) {
          // Legacy fallback: if a bill is not hospital-scoped, use deterministic reference
          receiptNumber = `RCP-${billId}-${Date.now()}`;
        } else {
          const [settingsRows] = await connection.query(
            `
              SELECT setting_key, setting_value
              FROM system_settings
              WHERE hospital_id = ?
                AND setting_key IN (?, ?)
              FOR UPDATE
            `,
            [hospitalId, RECEIPT_PREFIX_KEY, RECEIPT_NEXT_KEY]
          );

          const settings = Object.fromEntries(settingsRows.map(row => [row.setting_key, row.setting_value]));
          const prefix = settings[RECEIPT_PREFIX_KEY] || 'RCP';
          const nextSequence = Number.parseInt(settings[RECEIPT_NEXT_KEY], 10) || 1;

          receiptNumber = formatReceiptNumber(prefix, nextSequence);

          await connection.query(
            `
              INSERT INTO system_settings (hospital_id, setting_key, setting_value, description)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            `,
            [hospitalId, RECEIPT_NEXT_KEY, String(nextSequence + 1), 'Next receipt sequence number']
          );

          if (!settings[RECEIPT_PREFIX_KEY]) {
            await connection.query(
              `
                INSERT INTO system_settings (hospital_id, setting_key, setting_value, description)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
              `,
              [hospitalId, RECEIPT_PREFIX_KEY, prefix, 'Prefix for payment receipts']
            );
          }
        }
      }

      const paymentSql = `
        INSERT INTO payments (bill_id, amount, payment_method, reference_number, received_by) 
        VALUES (?, ?, ?, ?, ?)
      `;

      await connection.query(paymentSql, [billId, amount, payment_method, receiptNumber, received_by]);

      const totalPaidSql = "SELECT SUM(amount) as total_paid FROM payments WHERE bill_id = ?";
      const [paidResults] = await connection.query(totalPaidSql, [billId]);
      const totalPaid = paidResults[0].total_paid || 0;

      const billSql = "SELECT final_amount FROM bills WHERE id = ?";
      const [billResults] = await connection.query(billSql, [billId]);
      const finalAmount = billResults[0].final_amount;

      let paymentStatus = 'pending';
      if (totalPaid >= finalAmount) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }

      const updateSql = "UPDATE bills SET payment_status = ? WHERE id = ?";
      await connection.query(updateSql, [paymentStatus, billId]);

      await connection.commit();
      return { paymentStatus, totalPaid, receiptNumber };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update system settings
  updateSettings: async (settingsData, hospitalId = null) => {
    const { consultation_fee } = settingsData;

    const sql = `
      INSERT INTO system_settings (hospital_id, setting_key, setting_value, updated_at)
      VALUES (?, 'consultation_fee', ?, NOW())
      ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value),
        updated_at = NOW()
    `;

    await db.query(sql, [hospitalId, consultation_fee]);
    return { success: true };
  }
};

module.exports = Bill;
