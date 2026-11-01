const LabOrder = require("../models/LabOrder");
const db = require("../config/dbconfig");

const labController = {
  // Lab Test Management
  createTest: async (req, res) => {
    try {
      const {
        test_name,
        test_code,
        category,
        price,
        normal_range,
        unit,
        description,
        parameters,
        is_enabled,
      } = req.body;
      const hospitalId = req.hospitalId || req.user?.hospital_id;

      if (!hospitalId || !test_name || !test_code || !price) {
        return res.status(400).json({ error: "Required fields missing" });
      }

      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        // Create the lab test
        const testSql = `
          INSERT INTO lab_tests (hospital_id, test_name, test_code, category, price, normal_range, unit, description, is_enabled, is_custom)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `;
        const [testResult] = await connection.query(testSql, [
          hospitalId,
          test_name,
          test_code,
          category,
          price,
          normal_range || null,
          unit || null,
          description || null,
          is_enabled === undefined ? true : Boolean(is_enabled),
        ]);
        const testId = testResult.insertId;

        // Add parameters if provided
        if (parameters && parameters.length > 0) {
          const paramSql = `INSERT INTO lab_test_parameters (lab_test_id, parameter_name, unit, normal_range) VALUES ?`;
          const paramValues = parameters.map(p => [testId, p.parameter_name, p.unit, p.normal_range]);
          await connection.query(paramSql, [paramValues]);
        }

        await connection.commit();

        res.json({
          success: true,
          test: {
            id: testId,
            test_name,
            test_code,
            category,
            price,
            normal_range,
            unit,
            description,
            is_enabled: is_enabled === undefined ? true : Boolean(is_enabled),
            is_custom: true,
          }
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("âŒ Lab test creation error:", error);
      res.status(400).json({ error: "Test creation failed", details: error.message });
    }
  },

  getAllTests: async (req, res) => {
    try {
      const hospitalId = req.hospitalId || req.user?.hospital_id;
      const enabledOnly = !['admin', 'supervisor'].includes(req.user?.role);

      const sql = `
        SELECT 
          lt.*,
          ltp.id as param_id,
          ltp.parameter_name,
          ltp.unit,
          ltp.normal_range
        FROM lab_tests lt
        LEFT JOIN lab_test_parameters ltp ON lt.id = ltp.lab_test_id
        WHERE lt.hospital_id = ?
          ${enabledOnly ? "AND lt.is_enabled = TRUE" : ""}
        ORDER BY lt.category, lt.test_name, ltp.id
      `;

      const [results] = await db.query(sql, [hospitalId]);

      // Group parameters by test
      const testsMap = new Map();

      results.forEach(row => {
        if (!testsMap.has(row.id)) {
          testsMap.set(row.id, {
            id: row.id,
            test_name: row.test_name,
            test_code: row.test_code,
            category: row.category,
            price: row.price,
            description: row.description,
            is_enabled: row.is_enabled,
            is_custom: row.is_custom,
            template_id: row.template_id,
            created_at: row.created_at,
            parameters: []
          });
        }

        if (row.param_id) {
          testsMap.get(row.id).parameters.push({
            id: row.param_id,
            parameter_name: row.parameter_name,
            unit: row.unit,
            normal_range: row.normal_range
          });
        }
      });

      const tests = Array.from(testsMap.values());
      res.json(tests);
    } catch (error) {
      console.error("Get tests error:", error);
      res.status(500).json({ error: "Failed to fetch tests" });
    }
  },

  getTestById: async (req, res) => {
    try {
      const hospitalId = req.hospitalId || req.user?.hospital_id;
      const sql = `
        SELECT 
          lt.*,
          ltp.id as param_id,
          ltp.parameter_name,
          ltp.unit,
          ltp.normal_range
        FROM lab_tests lt
        LEFT JOIN lab_test_parameters ltp ON lt.id = ltp.lab_test_id
        WHERE lt.id = ? AND lt.hospital_id = ?
        ORDER BY ltp.id
      `;

      const [results] = await db.query(sql, [req.params.id, hospitalId]);

      if (results.length === 0) {
        return res.status(404).json({ error: "Test not found" });
      }

      const test = {
        id: results[0].id,
        test_name: results[0].test_name,
        test_code: results[0].test_code,
        category: results[0].category,
        price: results[0].price,
        description: results[0].description,
        is_enabled: results[0].is_enabled,
        is_custom: results[0].is_custom,
        template_id: results[0].template_id,
        created_at: results[0].created_at,
        parameters: []
      };

      results.forEach(row => {
        if (row.param_id) {
          test.parameters.push({
            id: row.param_id,
            parameter_name: row.parameter_name,
            unit: row.unit,
            normal_range: row.normal_range
          });
        }
      });

      res.json(test);
    } catch (error) {
      console.error("Get test error:", error);
      res.status(500).json({ error: "Failed to fetch test" });
    }
  },

  searchTests: async (req, res) => {
    try {
      const { query } = req.query;
      const hospitalId = req.hospitalId || req.user?.hospital_id;
      const enabledOnly = !['admin', 'supervisor'].includes(req.user?.role);
      const sql = `
        SELECT DISTINCT lt.*
        FROM lab_tests lt
        WHERE lt.hospital_id = ?
          ${enabledOnly ? "AND lt.is_enabled = TRUE" : ""}
          AND (lt.test_name LIKE ? OR lt.test_code LIKE ? OR lt.category LIKE ?)
        ORDER BY lt.category, lt.test_name
      `;
      const searchTerm = `%${query}%`;
      const [results] = await db.query(sql, [hospitalId, searchTerm, searchTerm, searchTerm]);
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  },

  updateTest: async (req, res) => {
    try {
      const {
        test_name,
        test_code,
        category,
        price,
        normal_range,
        unit,
        description,
        parameters,
        is_enabled,
      } = req.body;
      const hospitalId = req.hospitalId || req.user?.hospital_id;

      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        const [[existingTest]] = await connection.query(
          `SELECT id, is_custom
           FROM lab_tests
           WHERE id = ? AND hospital_id = ?
           LIMIT 1`,
          [req.params.id, hospitalId]
        );

        if (!existingTest) {
          await connection.rollback();
          return res.status(404).json({ error: "Test not found" });
        }

        if (existingTest.is_custom) {
          const testSql = `
            UPDATE lab_tests
            SET test_name = ?,
                test_code = ?,
                category = ?,
                price = ?,
                normal_range = ?,
                unit = ?,
                description = ?,
                is_enabled = COALESCE(?, is_enabled)
            WHERE id = ? AND hospital_id = ?
          `;
          await connection.query(testSql, [
            test_name,
            test_code,
            category,
            price,
            normal_range || null,
            unit || null,
            description || null,
            is_enabled,
            req.params.id,
            hospitalId,
          ]);

          if (parameters) {
            await connection.query(
              'DELETE ltp FROM lab_test_parameters ltp JOIN lab_tests lt ON lt.id = ltp.lab_test_id WHERE ltp.lab_test_id = ? AND lt.hospital_id = ?',
              [req.params.id, hospitalId]
            );

            if (parameters.length > 0) {
              const paramSql = `INSERT INTO lab_test_parameters (lab_test_id, parameter_name, unit, normal_range) VALUES ?`;
              const paramValues = parameters.map((parameter) => [
                req.params.id,
                parameter.parameter_name,
                parameter.unit,
                parameter.normal_range,
              ]);
              await connection.query(paramSql, [paramValues]);
            }
          }
        } else {
          await connection.query(
            `UPDATE lab_tests
             SET price = COALESCE(?, price),
                 is_enabled = COALESCE(?, is_enabled),
                 synced_at = NOW()
             WHERE id = ? AND hospital_id = ?`,
            [price, is_enabled, req.params.id, hospitalId]
          );
        }

        await connection.commit();
        res.json({ success: true, message: "Test updated successfully" });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Update error:", error);
      res.status(400).json({ error: "Update failed", details: error.message });
    }
  },

  deleteTest: async (req, res) => {
    try {
      const hospitalId = req.hospitalId || req.user?.hospital_id;
      const [[existingTest]] = await db.query(
        'SELECT id, is_custom FROM lab_tests WHERE id = ? AND hospital_id = ? LIMIT 1',
        [req.params.id, hospitalId]
      );

      if (!existingTest) {
        return res.status(404).json({ error: "Test not found" });
      }

      if (!existingTest.is_custom) {
        return res.status(400).json({
          error: "Template-based tests cannot be deleted. Disable the test instead."
        });
      }

      await db.query('DELETE FROM lab_tests WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
      res.json({ success: true, message: "Test deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Delete failed" });
    }
  },

  completeLab: async (req, res) => {
    try {
      const { orderId } = req.params;

      // Get the lab order to find the queue_id
      const getOrderSql = `SELECT queue_id, patient_id FROM lab_orders WHERE id = ?`;
      const [results] = await db.query(getOrderSql, [orderId]);

      if (!results.length) {
        return res.status(404).json({ error: "Lab order not found" });
      }

      const { queue_id, patient_id } = results[0];

      // Mark lab order as completed
      const updateOrderSql = `UPDATE lab_orders SET status = 'completed' WHERE id = ?`;
      await db.query(updateOrderSql, [orderId]);

      // Prefer the active lab queue, but fall back to the latest lab queue entry
      // so completion still works even after an interrupted refresh/navigation.
      const [queueResults] = await db.query(
        `SELECT id
         FROM queue
         WHERE patient_id = ?
           AND department = 'lab'
           AND hospital_id = ?
           AND status IN ('waiting', 'in_progress')
         ORDER BY created_at DESC
         LIMIT 1`,
        [patient_id, req.user.hospital_id]
      );

      let queueId = queueResults[0]?.id || null;

      if (!queueId) {
        const [fallbackQueueResults] = await db.query(
          `SELECT id
           FROM queue
           WHERE patient_id = ?
             AND department = 'lab'
             AND hospital_id = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [patient_id, req.user.hospital_id]
        );

        queueId = fallbackQueueResults[0]?.id || null;
      }

      if (!queueId) {
        return res.status(404).json({ error: "Queue item not found" });
      }

      // Call the labComplete from queue controller
      req.params.queueId = queueId;
      req.body.labOrderId = orderId;

      const queueController = require("./queueController");
      return await queueController.labComplete(req, res);

    } catch (error) {
      console.error("Error completing lab:", error);
      res.status(500).json({ error: "Failed to complete lab order" });
    }
  },

  // Lab Order Management
  getPendingOrders: async (req, res) => {
    try {
      const hospitalId = req.user.hospital_id;
      const orders = await LabOrder.getPending(hospitalId);
      res.json(orders);
    } catch (error) {
      console.error("Get pending orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },

  getAllOrders: async (req, res) => {
    try {
      const hospitalId = req.user.hospital_id;
      const orders = await LabOrder.getAll(hospitalId);
      res.json(orders);
    } catch (error) {
      console.error("Get all orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },

  getOrderById: async (req, res) => {
    try {
      const sql = `
        SELECT 
          lo.id as order_id,
          lo.queue_id,
          lo.status as order_status,
          lo.notes as order_notes,
          lo.created_at as order_date,
          p.id as patient_id,
          p.patient_number,
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
          ltp.id as param_id,
          ltp.parameter_name,
          ltp.unit,
          ltp.normal_range,
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
        LEFT JOIN lab_test_parameters ltp ON lt.id = ltp.lab_test_id
        LEFT JOIN lab_results lr ON loi.id = lr.lab_order_item_id AND ltp.id = lr.lab_test_parameter_id
        LEFT JOIN users u2 ON lr.tested_by = u2.id
        WHERE lo.id = ? AND lo.hospital_id = ?
        ORDER BY loi.id, ltp.id
      `;

      const [results] = await db.query(sql, [req.params.id, req.user.hospital_id]);

      if (results.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = {
        id: results[0].order_id,
        queue_id: results[0].queue_id,
        patient_id: results[0].patient_id,
        patient_number: results[0].patient_number,
        patient_name: results[0].patient_name,
        age: results[0].age,
        gender: results[0].gender,
        doctor_name: results[0].doctor_name,
        status: results[0].order_status,
        notes: results[0].order_notes,
        created_at: results[0].order_date,
        // Add active lab queue ID for frontend actions
        active_lab_queue_id: null,
        tests: []
      };

      // Fetch active lab queue ID for this patient
      try {
        const [qRes] = await db.query(
          "SELECT id FROM queue WHERE patient_id = ? AND department = 'lab' AND status IN ('waiting', 'in_progress') ORDER BY created_at DESC LIMIT 1",
          [order.patient_id]
        );
        if (qRes.length > 0) {
          order.active_lab_queue_id = qRes[0].id;
        }
      } catch (qErr) {
        console.error("Error fetching active queue:", qErr);
      }

      const testsMap = new Map();

      results.forEach(row => {
        if (row.item_id && !testsMap.has(row.item_id)) {
          testsMap.set(row.item_id, {
            item_id: row.item_id,
            item_status: row.item_status,
            test_id: row.test_id,
            test_name: row.test_name,
            test_code: row.test_code,
            category: row.category,
            price: row.price,
            parameters: []
          });
        }

        if (row.param_id && testsMap.has(row.item_id)) {
          testsMap.get(row.item_id).parameters.push({
            param_id: row.param_id,
            parameter_name: row.parameter_name,
            unit: row.unit,
            normal_range: row.normal_range,
            result: row.result_id ? {
              result_id: row.result_id,
              result_value: row.result_value,
              remarks: row.remarks,
              is_abnormal: row.is_abnormal,
              tested_at: row.tested_at,
              tested_by: row.tested_by_name
            } : null
          });
        }
      });

      order.tests = Array.from(testsMap.values());
      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  },

  startOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      await LabOrder.updateStatus(orderId, 'in_progress', req.user.hospital_id);
      res.json({ success: true, message: "Order started" });
    } catch (error) {
      console.error("Start order error:", error);
      res.status(500).json({ error: "Failed to start order" });
    }
  },

  addResults: async (req, res) => {
    try {
      const { itemId } = req.params;
      const { results, general_remarks } = req.body;
      const tested_by = req.user.id;

      if (!results || results.length === 0) {
        return res.status(400).json({ error: "Results are required" });
      }

      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        // Insert results for each parameter
        const resultSql = `
          INSERT INTO lab_results (lab_order_item_id, lab_test_parameter_id, result_value, remarks, is_abnormal, tested_by)
          VALUES ?
        `;

        const resultValues = results.map(r => [
          itemId,
          r.parameter_id,
          r.result_value,
          r.remarks || general_remarks || null,
          r.is_abnormal || false,
          tested_by
        ]);

        await connection.query(resultSql, [resultValues]);

        // Update item status to completed
        const updateItemSql = `UPDATE lab_order_items SET status = 'completed' WHERE id = ?`;
        await connection.query(updateItemSql, [itemId]);

        // Check if all items in the order are completed
        const checkAllCompletedSql = `
          SELECT loi.lab_order_id,
                COUNT(*) as total_items,
                SUM(CASE WHEN loi.status = 'completed' THEN 1 ELSE 0 END) as completed_items
          FROM lab_order_items loi
          WHERE loi.lab_order_id = (SELECT lab_order_id FROM lab_order_items WHERE id = ?)
          GROUP BY loi.lab_order_id
        `;

        const [orderCheck] = await connection.query(checkAllCompletedSql, [itemId]);

        let allCompleted = false;
        let labOrderId = null;

        if (orderCheck.length > 0) {
          const { lab_order_id, total_items, completed_items } = orderCheck[0];
          labOrderId = lab_order_id;

          if (total_items === completed_items) {
            allCompleted = true;
            const updateOrderSql = `UPDATE lab_orders SET status = 'completed' WHERE id = ?`;
            await connection.query(updateOrderSql, [lab_order_id]);
          }
        }

        await connection.commit();

        // If all tests are completed, automatically send results to doctor
        if (allCompleted && labOrderId) {
          try {
            // Get the lab order to find the queue_id and patient_id
            const getOrderSql = `SELECT queue_id, patient_id FROM lab_orders WHERE id = ?`;
            const [orderResults] = await db.query(getOrderSql, [labOrderId]);

            if (orderResults.length > 0) {
              const { queue_id, patient_id } = orderResults[0];

              // Find the current lab queue item
              const findQueueSql = `SELECT id FROM queue WHERE patient_id = ? AND department = 'lab' AND status IN ('waiting', 'in_progress') ORDER BY created_at DESC LIMIT 1`;
              const [queueResults] = await db.query(findQueueSql, [patient_id]);

              if (queueResults.length > 0) {
                const queueId = queueResults[0].id;
                const Queue = require("../models/Queue");

                // Transfer patient back to doctor queue with lab results note
                const newQueue = await Queue.returnPatientToDepartment(
                  queueId,
                  patient_id,
                  'doctor',
                  req.user.hospital_id
                );

                // Add note about lab results being ready
                const updateNotesSql = `
                  UPDATE queue 
                  SET notes = CONCAT(IFNULL(notes, ''), '\n[LAB RESULTS READY - Order #${labOrderId}]')
                  WHERE id = ?
                `;
                await db.query(updateNotesSql, [newQueue.id]);


                return res.json({
                  success: true,
                  message: "All results saved! Patient automatically sent back to doctor.",
                  allCompleted: true,
                  newQueue
                });
              }
            }
          } catch (autoCompleteError) {
            console.error("âš ï¸ Auto-complete to doctor failed:", autoCompleteError);
            // Don't fail the save, just report that results were saved
          }
        }

        res.json({ success: true, message: "Results saved successfully", allCompleted });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("âŒ Lab result error:", error);
      res.status(500).json({ error: "Failed to save results", details: error.message });
    }
  },

  updateResults: async (req, res) => {
    try {
      const { itemId } = req.params;
      const { results, general_remarks } = req.body;
      const tested_by = req.user.id;

      if (!results || results.length === 0) {
        return res.status(400).json({ error: "Results are required" });
      }

      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        // Update each result
        for (const r of results) {
          if (r.result_id) {
            // Update existing result
            const updateSql = `
              UPDATE lab_results 
              SET result_value = ?, remarks = ?, is_abnormal = ?, tested_by = ?, tested_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `;
            await connection.query(updateSql, [
              r.result_value,
              r.remarks || general_remarks || null,
              r.is_abnormal || false,
              tested_by,
              r.result_id
            ]);
          } else {
            // Insert new result
            const insertSql = `
              INSERT INTO lab_results (lab_order_item_id, lab_test_parameter_id, result_value, remarks, is_abnormal, tested_by)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            await connection.query(insertSql, [
              itemId,
              r.parameter_id,
              r.result_value,
              r.remarks || general_remarks || null,
              r.is_abnormal || false,
              tested_by
            ]);
          }
        }

        await connection.commit();
        res.json({ success: true, message: "Results updated successfully" });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("âŒ Lab result update error:", error);
      res.status(500).json({ error: "Failed to update results", details: error.message });
    }
  },

  getAllResults: async (req, res) => {
    try {
      let sql = `
        SELECT 
          lo.id as order_id,
          lo.status as order_status,
          lo.notes as order_notes,
          lo.created_at as order_date,
          p.id as patient_id,
          p.name as patient_name,
          p.age,
          p.gender,
          p.phone,
          u.username as doctor_name,
          loi.id as item_id,
          loi.status as item_status,
          lt.id as test_id,
          lt.test_name,
          lt.test_code,
          lt.category,
          lt.price,
          ltp.id as param_id,
          ltp.parameter_name,
          ltp.unit,
          ltp.normal_range,
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
        LEFT JOIN lab_test_parameters ltp ON lt.id = ltp.lab_test_id
        LEFT JOIN lab_results lr ON loi.id = lr.lab_order_item_id AND ltp.id = lr.lab_test_parameter_id
        LEFT JOIN users u2 ON lr.tested_by = u2.id
        WHERE lo.status IN ('in_progress', 'completed')
      `;

      const params = [];
      if (req.user.hospital_id) {
        sql += " AND lo.hospital_id = ?";
        params.push(req.user.hospital_id);
      }

      sql += `
        ORDER BY lo.created_at DESC, loi.id ASC, ltp.id ASC
      `;

      const [results] = await db.query(sql, params);

      // Group results by order and test
      const ordersMap = new Map();

      results.forEach(row => {
        if (!ordersMap.has(row.order_id)) {
          ordersMap.set(row.order_id, {
            id: row.order_id,
            status: row.order_status,
            notes: row.order_notes,
            order_date: row.order_date,
            patient_id: row.patient_id,
            patient_name: row.patient_name,
            age: row.age,
            gender: row.gender,
            phone: row.phone,
            doctor_name: row.doctor_name,
            tests: new Map()
          });
        }

        const order = ordersMap.get(row.order_id);

        if (row.item_id && !order.tests.has(row.item_id)) {
          order.tests.set(row.item_id, {
            item_id: row.item_id,
            item_status: row.item_status,
            test_id: row.test_id,
            test_name: row.test_name,
            test_code: row.test_code,
            category: row.category,
            price: row.price,
            parameters: []
          });
        }

        if (row.param_id) {
          order.tests.get(row.item_id).parameters.push({
            param_id: row.param_id,
            parameter_name: row.parameter_name,
            unit: row.unit,
            normal_range: row.normal_range,
            result: row.result_id ? {
              result_id: row.result_id,
              result_value: row.result_value,
              remarks: row.remarks,
              is_abnormal: row.is_abnormal,
              tested_at: row.tested_at,
              tested_by: row.tested_by_name
            } : null
          });
        }
      });

      const orders = Array.from(ordersMap.values()).map(order => ({
        ...order,
        tests: Array.from(order.tests.values())
      }));

      res.json(orders);
    } catch (error) {
      console.error("Error fetching lab results:", error);
      res.status(500).json({ error: "Failed to fetch lab results" });
    }
  },

  // Get results for a specific patient
  getResultsByPatient: async (req, res) => {
    try {
      const { patientId } = req.params;

      let sql = `
        SELECT 
          lo.id as order_id,
          lo.status as order_status,
          lo.notes as order_notes,
          lo.created_at as order_date,
          p.id as patient_id,
          p.name as patient_name,
          p.age,
          p.gender,
          u.username as doctor_name,
          loi.id as item_id,
          loi.status as item_status,
          lt.test_name,
          lt.test_code,
          lt.category,
          ltp.id as param_id,
          ltp.parameter_name,
          ltp.unit,
          ltp.normal_range,
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
        LEFT JOIN lab_test_parameters ltp ON lt.id = ltp.lab_test_id
        LEFT JOIN lab_results lr ON loi.id = lr.lab_order_item_id AND ltp.id = lr.lab_test_parameter_id
        LEFT JOIN users u2 ON lr.tested_by = u2.id
        WHERE lo.patient_id = ?
      `;

      const params = [patientId];
      if (req.user.hospital_id) {
        sql += " AND lo.hospital_id = ?";
        params.push(req.user.hospital_id);
      }

      sql += `
        ORDER BY lo.created_at DESC, loi.id, ltp.id
      `;

      const [results] = await db.query(sql, params);

      // Group by order and test
      const ordersMap = new Map();

      results.forEach(row => {
        if (!ordersMap.has(row.order_id)) {
          ordersMap.set(row.order_id, {
            id: row.order_id,
            status: row.order_status,
            notes: row.order_notes,
            order_date: row.order_date,
            patient_id: row.patient_id,
            patient_name: row.patient_name,
            age: row.age,
            gender: row.gender,
            doctor_name: row.doctor_name,
            tests: new Map()
          });
        }

        const order = ordersMap.get(row.order_id);

        if (row.item_id && !order.tests.has(row.item_id)) {
          // Initialize test with general remarks from the first parameter that has remarks
          let general_remarks = null;
          let tested_at = null;
          let tested_by = null;

          // Find the first parameter with remarks to use as general remarks
          const paramsWithRemarks = results.filter(r =>
            r.item_id === row.item_id && r.remarks
          );

          if (paramsWithRemarks.length > 0) {
            general_remarks = paramsWithRemarks[0].remarks;
            tested_at = paramsWithRemarks[0].tested_at;
            tested_by = paramsWithRemarks[0].tested_by_name;
          }

          order.tests.set(row.item_id, {
            item_id: row.item_id,
            item_status: row.item_status,
            test_name: row.test_name,
            test_code: row.test_code,
            category: row.category,
            general_remarks: general_remarks,
            tested_at: tested_at,
            tested_by: tested_by,
            parameters: []
          });
        }

        if (row.param_id) {
          // Add parameter without remarks (they'll be handled at the test level)
          order.tests.get(row.item_id).parameters.push({
            param_id: row.param_id,
            parameter_name: row.parameter_name,
            unit: row.unit,
            normal_range: row.normal_range,
            result: row.result_id ? {
              result_id: row.result_id,
              result_value: row.result_value,
              is_abnormal: row.is_abnormal,
              tested_at: row.tested_at,
              tested_by: row.tested_by_name
              // Removed remarks from individual parameters
            } : null
          });
        }
      });

      const orders = Array.from(ordersMap.values()).map(order => ({
        ...order,
        tests: Array.from(order.tests.values())
      }));

      res.json(orders);
    } catch (error) {
      console.error("Error fetching patient results:", error);
      res.status(500).json({ error: "Failed to fetch patient results" });
    }
  },

  getLabOrderByQueueId: async (req, res) => {
    try {
      const { queueId } = req.params;
      const labOrder = await LabOrder.getByQueueId(queueId, req.user.hospital_id);

      if (!labOrder) {
        return res.status(404).json({
          success: false,
          error: "Lab order not found"
        });
      }

      res.json(labOrder);
    } catch (error) {
      console.error('Get lab order by queue error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch lab order"
      });
    }
  }

};

module.exports = labController;
