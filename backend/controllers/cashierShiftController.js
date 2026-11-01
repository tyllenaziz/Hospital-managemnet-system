const db = require("../config/dbconfig");
const auditLogger = require("../utils/auditLogger");

const cashierShiftController = {
    /**
     * Open a new shift
     */
    openShift: async (req, res) => {
        try {
            const userId = req.user.id;
            const { opening_balance = 0 } = req.body;
            const today = new Date().toISOString().split('T')[0];

            // Check if user already has an open shift
            const [existingShift] = await db.query(
                `SELECT id FROM cashier_shifts WHERE user_id = ? AND status = 'open' AND hospital_id = ?`,
                [userId, req.user.hospital_id]
            );

            if (existingShift.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'You already have an open shift. Please close it first.',
                    shiftId: existingShift[0].id
                });
            }

            // Create new shift
            const [result] = await db.query(
                `INSERT INTO cashier_shifts (user_id, shift_date, opening_balance, status, hospital_id)
         VALUES (?, ?, ?, 'open', ?)`,
                [userId, today, opening_balance, req.user.hospital_id]
            );

            const shiftId = result.insertId;

            // Log the action
            await auditLogger.logShiftAction(req, shiftId, 'SHIFT_OPEN',
                `Shift opened with opening balance: KES ${opening_balance}`,
                { opening_balance }
            );

            res.json({
                success: true,
                message: 'Shift opened successfully',
                shift: {
                    id: shiftId,
                    shift_date: today,
                    opening_balance,
                    status: 'open'
                }
            });

        } catch (error) {
            console.error('Open shift error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to open shift',
                details: error.message
            });
        }
    },

    /**
     * Get current open shift for user
     */
    getCurrentShift: async (req, res) => {
        try {
            const userId = req.user.id;

            const [shifts] = await db.query(
                `SELECT cs.*, u.username as cashier_name
         FROM cashier_shifts cs
         JOIN users u ON cs.user_id = u.id
         WHERE cs.user_id = ? AND cs.status = 'open' AND cs.hospital_id = ?
         ORDER BY cs.opening_time DESC
         LIMIT 1`,
                [userId, req.user.hospital_id]
            );

            if (shifts.length === 0) {
                return res.json({
                    success: true,
                    hasOpenShift: false,
                    shift: null
                });
            }

            const shift = shifts[0];

            // Get transaction summary for this shift
            const [transactions] = await db.query(
                `SELECT 
          payment_method,
          transaction_type,
          SUM(amount) as total,
          COUNT(*) as count
         FROM shift_transactions
         WHERE shift_id = ?
         GROUP BY payment_method, transaction_type`,
                [shift.id]
            );

            // Calculate expected amounts
            let expectedCash = parseFloat(shift.opening_balance) || 0;
            let expectedMpesa = 0;
            let expectedCard = 0;
            let expectedInsurance = 0;
            let totalPayments = 0;
            let totalRefunds = 0;

            transactions.forEach(t => {
                const amount = parseFloat(t.total) || 0;
                if (t.transaction_type === 'payment' || t.transaction_type === 'float_in') {
                    if (t.payment_method === 'cash') expectedCash += amount;
                    else if (t.payment_method === 'mpesa') expectedMpesa += amount;
                    else if (t.payment_method === 'card') expectedCard += amount;
                    else if (t.payment_method === 'insurance') expectedInsurance += amount;
                    if (t.transaction_type === 'payment') totalPayments += amount;
                } else if (t.transaction_type === 'refund' || t.transaction_type === 'float_out') {
                    if (t.payment_method === 'cash') expectedCash -= amount;
                    if (t.transaction_type === 'refund') totalRefunds += amount;
                }
            });

            res.json({
                success: true,
                hasOpenShift: true,
                shift: {
                    ...shift,
                    expected_cash: expectedCash,
                    expected_mpesa: expectedMpesa,
                    expected_card: expectedCard,
                    expected_insurance: expectedInsurance,
                    total_payments: totalPayments,
                    total_refunds: totalRefunds,
                    transaction_summary: transactions
                }
            });

        } catch (error) {
            console.error('Get current shift error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get current shift'
            });
        }
    },

    /**
     * Close shift with reconciliation
     */
    closeShift: async (req, res) => {
        try {
            const userId = req.user.id;
            const {
                actual_cash,
                actual_mpesa,
                actual_card,
                cashier_notes
            } = req.body;

            // Get current open shift
            const [shifts] = await db.query(
                `SELECT * FROM cashier_shifts WHERE user_id = ? AND status = 'open' AND hospital_id = ?`,
                [userId, req.user.hospital_id]
            );

            if (shifts.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No open shift found'
                });
            }

            const shift = shifts[0];

            // Calculate expected amounts from transactions
            const [transactions] = await db.query(
                `SELECT 
          payment_method,
          transaction_type,
          SUM(amount) as total,
          COUNT(*) as count
         FROM shift_transactions
         WHERE shift_id = ?
         GROUP BY payment_method, transaction_type`,
                [shift.id]
            );

            let expectedCash = parseFloat(shift.opening_balance) || 0;
            let expectedMpesa = 0;
            let expectedCard = 0;
            let expectedInsurance = 0;
            let totalTransactions = 0;
            let totalBillsPaid = 0;
            let totalRefunds = 0;

            transactions.forEach(t => {
                const amount = parseFloat(t.total) || 0;
                const count = parseInt(t.count) || 0;
                if (t.transaction_type === 'payment' || t.transaction_type === 'float_in') {
                    if (t.payment_method === 'cash') expectedCash += amount;
                    else if (t.payment_method === 'mpesa') expectedMpesa += amount;
                    else if (t.payment_method === 'card') expectedCard += amount;
                    else if (t.payment_method === 'insurance') expectedInsurance += amount;
                    if (t.transaction_type === 'payment') totalBillsPaid += count;
                } else if (t.transaction_type === 'refund' || t.transaction_type === 'float_out') {
                    if (t.payment_method === 'cash') expectedCash -= amount;
                    if (t.transaction_type === 'refund') totalRefunds += count;
                }
                totalTransactions += count;
            });

            const cashVariance = (parseFloat(actual_cash) || 0) - expectedCash;

            // Update shift
            await db.query(
                `UPDATE cashier_shifts SET
          closing_time = NOW(),
          expected_cash = ?,
          expected_mpesa = ?,
          expected_card = ?,
          expected_insurance = ?,
          total_expected = ?,
          actual_cash = ?,
          actual_mpesa = ?,
          actual_card = ?,
          cash_variance = ?,
          total_transactions = ?,
          total_bills_paid = ?,
          total_refunds = ?,
          status = 'closed',
          cashier_notes = ?
         WHERE id = ?`,
                [
                    expectedCash,
                    expectedMpesa,
                    expectedCard,
                    expectedInsurance,
                    expectedCash + expectedMpesa + expectedCard + expectedInsurance,
                    actual_cash || 0,
                    actual_mpesa || 0,
                    actual_card || 0,
                    cashVariance,
                    totalTransactions,
                    totalBillsPaid,
                    totalRefunds,
                    cashier_notes,
                    shift.id
                ]
            );

            // Log the action
            await auditLogger.logShiftAction(req, shift.id, 'SHIFT_CLOSE',
                `Shift closed. Expected cash: KES ${expectedCash.toFixed(2)}, Actual: KES ${actual_cash}, Variance: KES ${cashVariance.toFixed(2)}`,
                { expected_cash: expectedCash, actual_cash, variance: cashVariance }
            );

            res.json({
                success: true,
                message: 'Shift closed successfully',
                summary: {
                    shift_id: shift.id,
                    opening_balance: shift.opening_balance,
                    expected_cash: expectedCash,
                    expected_mpesa: expectedMpesa,
                    expected_card: expectedCard,
                    actual_cash: parseFloat(actual_cash) || 0,
                    actual_mpesa: parseFloat(actual_mpesa) || 0,
                    actual_card: parseFloat(actual_card) || 0,
                    cash_variance: cashVariance,
                    total_transactions: totalTransactions,
                    total_bills_paid: totalBillsPaid,
                    variance_status: cashVariance === 0 ? 'balanced' : (cashVariance > 0 ? 'surplus' : 'shortage')
                }
            });

        } catch (error) {
            console.error('Close shift error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to close shift',
                details: error.message
            });
        }
    },

    /**
     * Record a transaction in the current shift
     */
    recordTransaction: async (req, res) => {
        try {
            const userId = req.user.id;
            const {
                transaction_type,
                amount,
                payment_method,
                reference_type,
                reference_id,
                patient_id,
                patient_name,
                description,
                receipt_number,
                mpesa_code
            } = req.body;

            // Get current open shift
            const [shifts] = await db.query(
                `SELECT id FROM cashier_shifts WHERE user_id = ? AND status = 'open' AND hospital_id = ?`,
                [userId, req.user.hospital_id]
            );

            if (shifts.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No open shift. Please open a shift first.'
                });
            }

            const shiftId = shifts[0].id;

            // Insert transaction
            const [result] = await db.query(
                `INSERT INTO shift_transactions 
         (shift_id, transaction_type, amount, payment_method, reference_type, reference_id, 
          patient_id, patient_name, description, receipt_number, mpesa_code, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [shiftId, transaction_type, amount, payment_method, reference_type, reference_id,
                    patient_id, patient_name, description, receipt_number, mpesa_code, userId]
            );

            res.json({
                success: true,
                message: 'Transaction recorded',
                transactionId: result.insertId
            });

        } catch (error) {
            console.error('Record transaction error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to record transaction'
            });
        }
    },

    /**
     * Get transactions for a shift
     */
    getShiftTransactions: async (req, res) => {
        try {
            const { shiftId } = req.params;

            const [transactions] = await db.query(
                `SELECT st.*, u.username as created_by_name
         FROM shift_transactions st
         LEFT JOIN users u ON st.created_by = u.id
         WHERE st.shift_id = ?
         ORDER BY st.created_at DESC`,
                [shiftId]
            );

            res.json({ success: true, transactions });

        } catch (error) {
            console.error('Get shift transactions error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get transactions'
            });
        }
    },

    /**
     * Add float (cash in/out)
     */
    addFloat: async (req, res) => {
        try {
            const userId = req.user.id;
            const { amount, type, description } = req.body; // type: 'in' or 'out'

            // Get current open shift
            const [shifts] = await db.query(
                `SELECT id FROM cashier_shifts WHERE user_id = ? AND status = 'open' AND hospital_id = ?`,
                [userId, req.user.hospital_id]
            );

            if (shifts.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No open shift'
                });
            }

            const shiftId = shifts[0].id;
            const transactionType = type === 'in' ? 'float_in' : 'float_out';

            await db.query(
                `INSERT INTO shift_transactions 
         (shift_id, transaction_type, amount, payment_method, description, created_by)
         VALUES (?, ?, ?, 'cash', ?, ?)`,
                [shiftId, transactionType, amount, description, userId]
            );

            await auditLogger.logShiftAction(req, shiftId, transactionType.toUpperCase(),
                `Float ${type}: KES ${amount}. ${description || ''}`,
                { amount, type }
            );

            res.json({
                success: true,
                message: `Float ${type} recorded successfully`
            });

        } catch (error) {
            console.error('Add float error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add float'
            });
        }
    },

    /**
     * Verify a closed shift (supervisor only)
     */
    verifyShift: async (req, res) => {
        try {
            const { shiftId } = req.params;
            const { verifier_notes, status } = req.body; // status: 'verified' or 'disputed'
            const verifierId = req.user.id;

            const [shift] = await db.query(
                `SELECT * FROM cashier_shifts WHERE id = ? AND hospital_id = ?`,
                [shiftId, req.user.hospital_id]
            );

            if (shift.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Shift not found'
                });
            }

            if (shift[0].status !== 'closed') {
                return res.status(400).json({
                    success: false,
                    error: 'Only closed shifts can be verified'
                });
            }

            await db.query(
                `UPDATE cashier_shifts SET
          status = ?,
          verified_by = ?,
          verified_at = NOW(),
          verifier_notes = ?
         WHERE id = ?`,
                [status || 'verified', verifierId, verifier_notes, shiftId]
            );

            await auditLogger.logShiftAction(req, shiftId, 'SHIFT_VERIFY',
                `Shift ${status || 'verified'}. ${verifier_notes || ''}`,
                { status, verifier_notes }
            );

            res.json({
                success: true,
                message: `Shift ${status || 'verified'} successfully`
            });

        } catch (error) {
            console.error('Verify shift error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to verify shift'
            });
        }
    },

    /**
     * Get all shifts (admin view)
     */
    getAllShifts: async (req, res) => {
        try {
            const { page = 1, limit = 20, userId, status, startDate, endDate } = req.query;
            const offset = (page - 1) * limit;

            let whereConditions = ['cs.hospital_id = ?'];
            let params = [req.user.hospital_id];

            if (userId) {
                whereConditions.push('cs.user_id = ?');
                params.push(userId);
            }
            if (status) {
                whereConditions.push('cs.status = ?');
                params.push(status);
            }
            if (startDate) {
                whereConditions.push('cs.shift_date >= ?');
                params.push(startDate);
            }
            if (endDate) {
                whereConditions.push('cs.shift_date <= ?');
                params.push(endDate);
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            const [shifts] = await db.query(
                `SELECT cs.*, 
          u.username as cashier_name,
          v.username as verifier_name
         FROM cashier_shifts cs
         JOIN users u ON cs.user_id = u.id
         LEFT JOIN users v ON cs.verified_by = v.id
         ${whereClause}
         ORDER BY cs.shift_date DESC, cs.opening_time DESC
         LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), parseInt(offset)]
            );

            const [countResult] = await db.query(
                `SELECT COUNT(*) as total FROM cashier_shifts cs ${whereClause}`,
                params
            );

            res.json({
                success: true,
                shifts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0]?.total || 0,
                    totalPages: Math.ceil((countResult[0]?.total || 0) / limit)
                }
            });

        } catch (error) {
            console.error('Get all shifts error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get shifts'
            });
        }
    },

    /**
     * Get shift report summary
     */
    getShiftReport: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const today = new Date().toISOString().split('T')[0];

            let dateCondition = 'shift_date = ?';
            let dateParams = [today];
            if (startDate && endDate) {
                dateCondition = 'shift_date BETWEEN ? AND ?';
                dateParams = [startDate, endDate];
            }

            const hospitalId = req.user.hospital_id;

            const [summary] = await db.query(`
        SELECT 
          COUNT(*) as total_shifts,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_shifts,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_shifts,
          SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified_shifts,
          SUM(expected_cash) as total_expected_cash,
          SUM(actual_cash) as total_actual_cash,
          SUM(cash_variance) as total_variance,
          SUM(CASE WHEN cash_variance < 0 THEN 1 ELSE 0 END) as shifts_with_shortage,
          SUM(CASE WHEN cash_variance > 0 THEN 1 ELSE 0 END) as shifts_with_surplus,
          SUM(total_transactions) as total_transactions,
          SUM(total_bills_paid) as total_bills_paid
        FROM cashier_shifts
        WHERE ${dateCondition} AND hospital_id = ?
      `, [...dateParams, hospitalId]);

            const [byUser] = await db.query(`
        SELECT 
          u.username,
          COUNT(*) as shift_count,
          SUM(cs.expected_cash) as expected_cash,
          SUM(cs.actual_cash) as actual_cash,
          SUM(cs.cash_variance) as variance
        FROM cashier_shifts cs
        JOIN users u ON cs.user_id = u.id
        WHERE ${dateCondition} AND cs.hospital_id = ?
        GROUP BY cs.user_id, u.username
        ORDER BY variance ASC
      `, [...dateParams, hospitalId]);

            res.json({
                success: true,
                report: {
                    summary: summary[0],
                    byUser
                }
            });

        } catch (error) {
            console.error('Get shift report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get shift report'
            });
        }
    }
};

module.exports = cashierShiftController;
