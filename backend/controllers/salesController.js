const db = require("../config/dbconfig");

const salesController = {
  // Create direct sale (anonymous walk-in customer)
  createDirectSale: async (req, res) => {
    const connection = await db.getConnection();

    try {
      const { items, total_amount, payment_method } = req.body;
      const sold_by = req.user.id;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Items are required" });
      }

      await connection.beginTransaction();

      // Create sale record
      const saleSql = `
        INSERT INTO direct_sales 
        (total_amount, payment_method, sold_by, sale_date, hospital_id) 
        VALUES (?, ?, ?, NOW(), ?)
      `;


      const [result] = await connection.query(saleSql, [total_amount, payment_method || 'cash', sold_by, req.user.hospital_id]);
      const saleId = result.insertId;



      // Process each item individually to handle custom items properly
      for (const item of items) {
        const itemSql = `
          INSERT INTO direct_sale_items 
          (sale_id, medicine_id, medicine_name, quantity, price, total, is_custom) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const itemValues = [
          saleId,
          item.medicine_id || null,  // NULL for custom items
          item.medicine_name,
          item.quantity,
          0,  // price per unit (not used for custom items)
          item.total_price,
          item.is_custom ? 1 : 0
        ];

        console.log('Inserting item:', itemValues);

        await connection.query(itemSql, itemValues);

        // Update stock ONLY for non-custom inventory items
        if (!item.is_custom && item.medicine_id) {


          const updateStockSql = `
            UPDATE medicines 
            SET stock = stock - ? 
            WHERE id = ? AND stock >= ?
          `;
          const [updateResult] = await connection.query(updateStockSql, [
            item.quantity,
            item.medicine_id,
            item.quantity
          ]);

          if (updateResult.affectedRows === 0) {
            throw new Error(`Insufficient stock for ${item.medicine_name}`);
          }

          console.log(`Stock updated successfully for ${item.medicine_name}`);
        } else {
          console.log(`Skipping stock update for custom item: ${item.medicine_name}`);
        }
      }

      await connection.commit();

      res.json({
        success: true,
        sale_id: saleId,
        message: "Sale completed successfully"
      });
    } catch (error) {
      await connection.rollback();
      console.error("Direct sale error:", error);
      res.status(500).json({
        error: "Failed to create sale",
        details: error.message,
        sqlMessage: error.sqlMessage
      });
    } finally {
      connection.release();
    }
  },

  // Get all direct sales
  getAllSales: async (req, res) => {
    try {
      let sql = `
        SELECT ds.*, u.username as sold_by_name,
               COUNT(dsi.id) as item_count
        FROM direct_sales ds
        LEFT JOIN users u ON ds.sold_by = u.id
        LEFT JOIN direct_sale_items dsi ON ds.id = dsi.sale_id
      `;

      const params = [];
      if (req.user.hospital_id) {
        sql += " WHERE ds.hospital_id = ?";
        params.push(req.user.hospital_id);
      }

      sql += `
        GROUP BY ds.id
        ORDER BY ds.sale_date DESC
      `;

      const [results] = await db.query(sql, params);
      res.json(results);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  },

  // Get sale details by ID
  getSaleById: async (req, res) => {
    try {
      const { id } = req.params;

      const saleSql = `
        SELECT ds.*, u.username as sold_by_name
        FROM direct_sales ds
        LEFT JOIN users u ON ds.sold_by = u.id
        WHERE ds.id = ?
      `;

      const params = [id];
      if (req.user.hospital_id) {
        saleSql += " AND ds.hospital_id = ?";
        params.push(req.user.hospital_id);
      }

      const [saleResults] = await db.query(saleSql, params);

      if (saleResults.length === 0) {
        return res.status(404).json({ error: "Sale not found" });
      }

      const itemsSql = `
        SELECT dsi.*, m.name as inventory_medicine_name
        FROM direct_sale_items dsi
        LEFT JOIN medicines m ON dsi.medicine_id = m.id
        WHERE dsi.sale_id = ?
      `;

      const [itemsResults] = await db.query(itemsSql, [id]);

      res.json({
        ...saleResults[0],
        items: itemsResults
      });
    } catch (error) {
      console.error("Error fetching sale details:", error);
      res.status(500).json({ error: "Failed to fetch sale details" });
    }
  }
};

module.exports = salesController;