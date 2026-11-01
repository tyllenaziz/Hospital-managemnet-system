const db = require("../config/dbconfig");

const LabOrder = {
  create: async (orderData) => {
    const { queue_id, patient_id, doctor_id, notes, tests } = orderData;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const sql = "INSERT INTO lab_orders (queue_id, patient_id, doctor_id, notes, hospital_id) VALUES (?, ?, ?, ?, ?)";
      const [result] = await connection.query(sql, [queue_id, patient_id, doctor_id, notes, orderData.hospital_id]);
      const labOrderId = result.insertId;

      if (tests && tests.length > 0) {
        const itemSql = "INSERT INTO lab_order_items (lab_order_id, lab_test_id) VALUES ?";
        // FIX: Extract test_id from each test object
        const itemValues = tests.map(test => [labOrderId, test.test_id || test]);
        await connection.query(itemSql, [itemValues]);
      }

      await connection.commit();
      return { id: labOrderId };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  getByQueueId: async (queueId, hospitalId = null) => {
    let sql = `
      SELECT lo.*, 
             u.username as doctor_name,
             loi.id as item_id,
             loi.status as item_status,
             lt.id as test_id,
             lt.test_name,
             lt.test_code,
             lt.category,
             lt.price,
             lt.unit,
             lt.normal_range,
             lr.id as result_id,
             lr.result_value,
             lr.is_abnormal,
             lr.tested_at
      FROM lab_orders lo
      LEFT JOIN users u ON lo.doctor_id = u.id
      LEFT JOIN lab_order_items loi ON lo.id = loi.lab_order_id
      LEFT JOIN lab_tests lt ON loi.lab_test_id = lt.id
      LEFT JOIN lab_results lr ON loi.id = lr.lab_order_item_id
      WHERE lo.queue_id = ?`;

    const params = [queueId];
    if (hospitalId) {
      sql += ' AND lo.hospital_id = ?';
      params.push(hospitalId);
    }

    const [results] = await db.query(sql, params);

    if (results.length === 0) {
      return null;
    }

    const labOrder = {
      id: results[0].id,
      queue_id: results[0].queue_id,
      patient_id: results[0].patient_id,
      doctor_id: results[0].doctor_id,
      doctor_name: results[0].doctor_name,
      notes: results[0].notes,
      status: results[0].status,
      created_at: results[0].created_at,
      tests: results.filter(r => r.item_id).map(r => ({
        item_id: r.item_id,
        item_status: r.item_status,
        test_id: r.test_id,
        test_name: r.test_name,
        test_code: r.test_code,
        category: r.category,
        price: r.price,
        unit: r.unit,
        normal_range: r.normal_range,
        result: r.result_id ? {
          result_value: r.result_value,
          is_abnormal: r.is_abnormal,
          tested_at: r.tested_at
        } : null
      }))
    };

    return labOrder;
  },

  // Update existing lab order
  update: async (labOrderId, orderData, hospitalId = null) => {
    const { queue_id, patient_id, doctor_id, notes, tests } = orderData;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Update main lab order record - scoped to hospital
      let updateSql = `
        UPDATE lab_orders 
        SET notes = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
      const updateParams = [notes, labOrderId];
      if (hospitalId) {
        updateSql += " AND hospital_id = ?";
        updateParams.push(hospitalId);
      }
      await connection.query(updateSql, updateParams);

      // Delete existing items that don't have results yet
      const deleteSql = `
        DELETE loi FROM lab_order_items loi
        LEFT JOIN lab_results lr ON loi.id = lr.lab_order_item_id
        WHERE loi.lab_order_id = ? AND lr.id IS NULL
      `;
      await connection.query(deleteSql, [labOrderId]);

      // Get existing test IDs that have results
      const existingTestsSql = `
        SELECT loi.lab_test_id
        FROM lab_order_items loi
        INNER JOIN lab_results lr ON loi.id = lr.lab_order_item_id
        WHERE loi.lab_order_id = ?
      `;
      const [existingTests] = await connection.query(existingTestsSql, [labOrderId]);
      const existingTestIds = existingTests.map(t => t.lab_test_id);

      // Insert new items (skip tests that already have results)
      if (tests && tests.length > 0) {
        // FIX: Extract test_id from each test object
        const testIds = tests.map(test => test.test_id || test);
        const newTests = testIds.filter(testId => !existingTestIds.includes(parseInt(testId)));

        if (newTests.length > 0) {
          const itemSql = "INSERT INTO lab_order_items (lab_order_id, lab_test_id) VALUES ?";
          const itemValues = newTests.map(test_id => [labOrderId, test_id]);
          await connection.query(itemSql, [itemValues]);
        }
      }

      await connection.commit();
      return { id: labOrderId };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  getById: async (id, hospitalId = null) => {
    let sql = `
      SELECT lo.*, 
             p.name as patient_name,
             p.age,
             p.gender,
             u.username as doctor_name,
             loi.id as item_id,
             loi.status as item_status,
             lt.id as test_id,
             lt.test_name,
             lt.test_code,
             lt.category,
             lt.price,
             lt.normal_range,
             lt.unit,
             lr.id as result_id,
             lr.result_value,
             lr.remarks,
             lr.is_abnormal,
             lr.tested_at,
             u2.username as tested_by_name
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.id
      JOIN users u ON lo.doctor_id = u.id
      LEFT JOIN lab_order_items loi ON lo.id = loi.lab_order_id
      LEFT JOIN lab_tests lt ON loi.lab_test_id = lt.id
      LEFT JOIN lab_results lr ON loi.id = lr.lab_order_item_id
      LEFT JOIN users u2 ON lr.tested_by = u2.id
      WHERE lo.id = ?`;
    const params = [id];
    if (hospitalId) {
      sql += " AND lo.hospital_id = ?";
      params.push(hospitalId);
    }

    const [results] = await db.query(sql, params);
    if (results.length === 0) return null;

    const order = {
      id: results[0].id,
      queue_id: results[0].queue_id,
      patient_id: results[0].patient_id,
      patient_name: results[0].patient_name,
      age: results[0].age,
      gender: results[0].gender,
      doctor_id: results[0].doctor_id,
      doctor_name: results[0].doctor_name,
      status: results[0].status,
      notes: results[0].notes,
      created_at: results[0].created_at,
      tests: []
    };

    results.forEach(row => {
      if (row.item_id) {
        order.tests.push({
          item_id: row.item_id,
          item_status: row.item_status,
          test_id: row.test_id,
          test_name: row.test_name,
          test_code: row.test_code,
          category: row.category,
          price: row.price,
          normal_range: row.normal_range,
          unit: row.unit,
          result: row.result_id ? {
            result_value: row.result_value,
            remarks: row.remarks,
            is_abnormal: row.is_abnormal,
            tested_at: row.tested_at,
            tested_by: row.tested_by_name
          } : null
        });
      }
    });

    return order;
  },

  getPending: async (hospitalId = null) => {
    let sql = `
      SELECT lo.*, 
             p.name as patient_name,
             p.age,
             p.gender,
             u.username as doctor_name,
             COUNT(loi.id) as test_count
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.id
      JOIN users u ON lo.doctor_id = u.id
      LEFT JOIN lab_order_items loi ON lo.id = loi.lab_order_id
      WHERE lo.status IN ('pending', 'in_progress')
    `;
    const params = [];

    if (hospitalId) {
      sql += " AND lo.hospital_id = ?";
      params.push(hospitalId);
    }

    sql += `
      GROUP BY lo.id
      ORDER BY lo.created_at ASC
    `;

    const [results] = await db.query(sql, params);
    return results;
  },

  getAll: async (hospitalId = null) => {
    let sql = `
      SELECT lo.*, 
             p.name as patient_name,
             p.age,
             p.gender,
             u.username as doctor_name,
             COUNT(loi.id) as test_count
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.id
      JOIN users u ON lo.doctor_id = u.id
      LEFT JOIN lab_order_items loi ON lo.id = loi.lab_order_id
    `;
    const params = [];

    if (hospitalId) {
      sql += " WHERE lo.hospital_id = ?";
      params.push(hospitalId);
    }

    sql += `
      GROUP BY lo.id
      ORDER BY lo.created_at DESC
    `;

    const [results] = await db.query(sql, params);
    return results;
  },

  updateStatus: async (id, status, hospitalId = null) => {
    let sql = "UPDATE lab_orders SET status = ? WHERE id = ?";
    const params = [status, id];
    if (hospitalId) {
      sql += " AND hospital_id = ?";
      params.push(hospitalId);
    }
    const [result] = await db.query(sql, params);
    return result.affectedRows;
  },

  addResult: async (itemId, resultData) => {
    const { result_value, remarks, is_abnormal, tested_by } = resultData;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const sql = `
        INSERT INTO lab_results (lab_order_item_id, result_value, remarks, is_abnormal, tested_by) 
        VALUES (?, ?, ?, ?, ?)
      `;

      const [result] = await connection.query(sql, [itemId, result_value, remarks, is_abnormal, tested_by]);

      const updateItemSql = "UPDATE lab_order_items SET status = 'completed' WHERE id = ?";
      await connection.query(updateItemSql, [itemId]);

      const checkSql = `
        SELECT loi.lab_order_id
        FROM lab_order_items loi
        WHERE loi.lab_order_id = (SELECT lab_order_id FROM lab_order_items WHERE id = ?)
        AND loi.status = 'pending'
      `;

      const [pendingItems] = await connection.query(checkSql, [itemId]);

      if (pendingItems.length === 0) {
        const updateOrderSql = `
          UPDATE lab_orders 
          SET status = 'completed' 
          WHERE id = (SELECT lab_order_id FROM lab_order_items WHERE id = ?)
        `;

        await connection.query(updateOrderSql, [itemId]);
      }

      await connection.commit();
      return { id: result.insertId };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = LabOrder;