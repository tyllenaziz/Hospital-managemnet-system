const db = require("../config/dbconfig");

const buildVisitSummarySubquery = ({ hospitalId = null, dateCondition = '' } = {}) => `
  SELECT
    b.patient_id,
    DATE(b.created_at) as visit_date,
    MAX(b.created_at) as last_bill_at,
    MAX(b.id) as latest_bill_id,
    MAX(COALESCE(b.consultation_fee, 0)) as consultation_revenue,
    SUM(COALESCE(b.lab_fee, 0)) as lab_revenue,
    SUM(COALESCE(b.pharmacy_fee, 0)) as pharmacy_revenue,
    (
      CASE
        WHEN SUM(CASE WHEN b.payment_status = 'paid' THEN 1 ELSE 0 END) > 0
          THEN MAX(COALESCE(b.consultation_fee, 0))
        ELSE 0
      END
      + SUM(CASE WHEN b.payment_status = 'paid' THEN COALESCE(b.lab_fee, 0) + COALESCE(b.pharmacy_fee, 0) ELSE 0 END)
    ) as paid_revenue,
    (
      CASE
        WHEN SUM(CASE WHEN b.payment_status = 'pending' THEN 1 ELSE 0 END) > 0
          THEN MAX(COALESCE(b.consultation_fee, 0))
        ELSE 0
      END
      + SUM(CASE WHEN b.payment_status = 'pending' THEN COALESCE(b.lab_fee, 0) + COALESCE(b.pharmacy_fee, 0) ELSE 0 END)
    ) as pending_revenue,
    (
      CASE
        WHEN SUM(CASE WHEN b.payment_status = 'partial' THEN 1 ELSE 0 END) > 0
          THEN MAX(COALESCE(b.consultation_fee, 0))
        ELSE 0
      END
      + SUM(CASE WHEN b.payment_status = 'partial' THEN COALESCE(b.lab_fee, 0) + COALESCE(b.pharmacy_fee, 0) ELSE 0 END)
    ) as partial_revenue,
    MAX(COALESCE(b.consultation_fee, 0))
      + SUM(COALESCE(b.lab_fee, 0))
      + SUM(COALESCE(b.pharmacy_fee, 0)) as visit_total_revenue
  FROM bills b
  WHERE 1 = 1
    ${dateCondition ? `AND ${dateCondition}` : ''}
    ${hospitalId ? 'AND b.hospital_id = ?' : ''}
  GROUP BY b.patient_id, DATE(b.created_at)
`;

const adminController = {
  // Get comprehensive dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const hospitalId = req.user?.hospital_id;

      // If no hospital_id, return empty stats (except for superadmin)
      if (!hospitalId && req.user?.role !== 'superadmin') {
        return res.json({ success: true, stats: {} });
      }

      // Build WHERE clause for hospital filtering
      const hospitalFilter = hospitalId ? 'AND hospital_id = ?' : '';
      const hospitalParam = hospitalId ? [hospitalId] : [];
      const todayVisitSummaryQuery = buildVisitSummarySubquery({
        hospitalId,
        dateCondition: 'DATE(b.created_at) = ?'
      });
      const totalVisitSummaryQuery = buildVisitSummarySubquery({ hospitalId });

      const queries = {
        // Total patients count (filtered by hospital)
        totalPatients: hospitalId
          ? `SELECT COUNT(*) as count FROM patients WHERE hospital_id = ?`
          : `SELECT COUNT(*) as count FROM patients`,

        // Total staff count (filtered by hospital)
        totalStaff: hospitalId
          ? `SELECT COUNT(*) as count FROM users WHERE role NOT IN ('patient', 'superadmin') AND hospital_id = ?`
          : `SELECT COUNT(*) as count FROM users WHERE role NOT IN ('patient', 'superadmin')`,

        // Today's appointments (using queue as appointments)
        todayAppointments: hospitalId
          ? `SELECT COUNT(*) as count FROM queue WHERE DATE(created_at) = ? AND status IN ('waiting', 'in_progress') AND hospital_id = ?`
          : `SELECT COUNT(*) as count FROM queue WHERE DATE(created_at) = ? AND status IN ('waiting', 'in_progress')`,

        // Today's revenue (filtered by hospital)
        todayRevenue: hospitalId
          ? `SELECT COALESCE(SUM(visit_total_revenue), 0) as revenue FROM (${todayVisitSummaryQuery}) visit_summary`
          : `SELECT COALESCE(SUM(visit_total_revenue), 0) as revenue FROM (${todayVisitSummaryQuery}) visit_summary`,

        // Today's expenses (filtered by hospital)
        todayExpenses: hospitalId
          ? `SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses WHERE expense_date = ? AND hospital_id = ?`
          : `SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses WHERE expense_date = ?`,

        // Total revenue (filtered by hospital)
        totalRevenue: hospitalId
          ? `SELECT COALESCE(SUM(visit_total_revenue), 0) as revenue FROM (${totalVisitSummaryQuery}) visit_summary`
          : `SELECT COALESCE(SUM(visit_total_revenue), 0) as revenue FROM (${totalVisitSummaryQuery}) visit_summary`,

        // Total expenses (filtered by hospital)
        totalExpenses: hospitalId
          ? `SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses WHERE hospital_id = ?`
          : `SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses`,

        // Active users (filtered by hospital)
        activeUsers: hospitalId
          ? `SELECT COUNT(*) as count FROM users WHERE lastLogin >= DATE_SUB(NOW(), INTERVAL 30 MINUTE) AND hospital_id = ?`
          : `SELECT COUNT(*) as count FROM users WHERE lastLogin >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)`,

        // Staff logged in today (filtered by hospital)
        todayActiveStaff: hospitalId
          ? `SELECT COUNT(*) as count FROM users WHERE DATE(lastLogin) = ? AND role NOT IN ('patient', 'superadmin') AND hospital_id = ?`
          : `SELECT COUNT(*) as count FROM users WHERE DATE(lastLogin) = ? AND role NOT IN ('patient', 'superadmin')`,

        // Recent patients (filtered by hospital)
        recentPatients: hospitalId
          ? `SELECT 'Patient Registered' as action, p.name as details, 'System' as user, p.created_at as timestamp, 'patient' as type
             FROM patients p WHERE p.hospital_id = ? ORDER BY p.created_at DESC LIMIT 3`
          : `SELECT 'Patient Registered' as action, p.name as details, 'System' as user, p.created_at as timestamp, 'patient' as type
             FROM patients p ORDER BY p.created_at DESC LIMIT 3`,

        // Recent queue (filtered by hospital)
        recentQueue: hospitalId
          ? `SELECT CONCAT('Queue ', q.department) as action, CONCAT(p.name, ' - ', q.queue_number) as details, 
             u.username as user, q.created_at as timestamp, 'queue' as type
             FROM queue q JOIN patients p ON q.patient_id = p.id LEFT JOIN users u ON q.assigned_to = u.id
             WHERE q.hospital_id = ? ORDER BY q.created_at DESC LIMIT 3`
          : `SELECT CONCAT('Queue ', q.department) as action, CONCAT(p.name, ' - ', q.queue_number) as details,
             u.username as user, q.created_at as timestamp, 'queue' as type
             FROM queue q JOIN patients p ON q.patient_id = p.id LEFT JOIN users u ON q.assigned_to = u.id
             ORDER BY q.created_at DESC LIMIT 3`,

        // Recent bills (filtered by hospital)
        recentBills: hospitalId
          ? `SELECT 'Bill Created' as action, CONCAT(p.name, ' - KES ', CAST(vs.visit_total_revenue AS CHAR)) as details, 
             u.username as user, vs.last_bill_at as timestamp, 'billing' as type
             FROM (${totalVisitSummaryQuery}) vs
             JOIN patients p ON vs.patient_id = p.id
             LEFT JOIN bills b ON vs.latest_bill_id = b.id
             LEFT JOIN users u ON b.created_by = u.id
             ORDER BY vs.last_bill_at DESC
             LIMIT 3`
          : `SELECT 'Bill Created' as action, CONCAT(p.name, ' - KES ', CAST(vs.visit_total_revenue AS CHAR)) as details,
             u.username as user, vs.last_bill_at as timestamp, 'billing' as type
             FROM (${totalVisitSummaryQuery}) vs
             JOIN patients p ON vs.patient_id = p.id
             LEFT JOIN bills b ON vs.latest_bill_id = b.id
             LEFT JOIN users u ON b.created_by = u.id
             ORDER BY vs.last_bill_at DESC
             LIMIT 3`,

        // Recent direct sales (filtered by hospital)
        recentSales: hospitalId
          ? `SELECT 'Medicine Sale' as action, CONCAT('Direct Sale - KES ', ds.total_amount) as details,
             u.username as user, ds.sale_date as timestamp, 'pharmacy' as type
             FROM direct_sales ds LEFT JOIN users u ON ds.sold_by = u.id
             WHERE ds.hospital_id = ? ORDER BY ds.sale_date DESC LIMIT 3`
          : `SELECT 'Medicine Sale' as action, CONCAT('Direct Sale - KES ', ds.total_amount) as details,
             u.username as user, ds.sale_date as timestamp, 'pharmacy' as type
             FROM direct_sales ds LEFT JOIN users u ON ds.sold_by = u.id
             ORDER BY ds.sale_date DESC LIMIT 3`
      };

      // Execute all queries with appropriate parameters
      const [
        [totalPatients],
        [totalStaff],
        [todayAppointments],
        [todayRevenue],
        [todayExpenses],
        [totalRevenue],
        [totalExpenses],
        [activeUsers],
        [todayActiveStaff],
        [recentPatients],
        [recentQueue],
        [recentBills],
        [recentSales]
      ] = await Promise.all([
        db.query(queries.totalPatients, hospitalId ? [hospitalId] : []),
        db.query(queries.totalStaff, hospitalId ? [hospitalId] : []),
        db.query(queries.todayAppointments, hospitalId ? [today, hospitalId] : [today]),
        db.query(queries.todayRevenue, hospitalId ? [today, hospitalId] : [today]),
        db.query(queries.todayExpenses, hospitalId ? [today, hospitalId] : [today]),
        db.query(queries.totalRevenue, hospitalId ? [hospitalId] : []),
        db.query(queries.totalExpenses, hospitalId ? [hospitalId] : []),
        db.query(queries.activeUsers, hospitalId ? [hospitalId] : []),
        db.query(queries.todayActiveStaff, hospitalId ? [today, hospitalId] : [today]),
        db.query(queries.recentPatients, hospitalId ? [hospitalId] : []),
        db.query(queries.recentQueue, hospitalId ? [hospitalId] : []),
        db.query(queries.recentBills, hospitalId ? [hospitalId] : []),
        db.query(queries.recentSales, hospitalId ? [hospitalId] : [])
      ]);

      // Combine and sort recent activities
      const allActivities = [
        ...recentPatients,
        ...recentQueue,
        ...recentBills,
        ...recentSales
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      const tRevenue = parseFloat(totalRevenue[0]?.revenue || 0);
      const tExpenses = parseFloat(totalExpenses[0]?.expenses || 0);
      const dayRevenue = parseFloat(todayRevenue[0]?.revenue || 0);
      const dayExpenses = parseFloat(todayExpenses[0]?.expenses || 0);

      const stats = {
        totalPatients: totalPatients[0]?.count || 0,
        totalStaff: totalStaff[0]?.count || 0,
        todayAppointments: todayAppointments[0]?.count || 0,
        todayRevenue: dayRevenue,
        todayExpenses: dayExpenses,
        todayProfit: dayRevenue - dayExpenses,
        totalRevenue: tRevenue,
        totalExpenses: tExpenses,
        totalProfit: tRevenue - tExpenses,
        presentStaff: todayActiveStaff[0]?.count || 0,
        systemStatus: 'Active',
        activeUsers: activeUsers[0]?.count || 0,
        recentActivity: allActivities.map(activity => ({
          id: Math.random(),
          action: activity.action,
          user: activity.user || 'System',
          details: activity.details,
          time: getTimeAgo(activity.timestamp),
          type: activity.type
        }))
      };

      res.json({ success: true, stats });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch dashboard statistics",
        details: error.message
      });
    }
  },

  // Get revenue statistics
  getRevenueStats: async (req, res) => {
    try {
      const { period = '7days' } = req.query;
      const hospitalId = req.user?.hospital_id;

      let dateFilter = "DATE(b.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
      let expenseDateFilter = "expense_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
      let groupByFormat = "visit_date";
      let expenseGroupByFormat = "expense_date"; // Expenses usually just have a date

      if (period === '30days') {
        dateFilter = "DATE(b.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
        expenseDateFilter = "expense_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
      } else if (period === '90days') {
        dateFilter = "DATE(b.created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)";
        expenseDateFilter = "expense_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)";
      } else if (period === '12months') {
        dateFilter = "DATE(b.created_at) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
        expenseDateFilter = "expense_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
        groupByFormat = "DATE_FORMAT(visit_date, '%Y-%m')";
        expenseGroupByFormat = "DATE_FORMAT(expense_date, '%Y-%m')";
      }

      const visitSummaryQuery = buildVisitSummarySubquery({
        hospitalId,
        dateCondition: dateFilter
      });

      const query = `
      SELECT 
        ${groupByFormat} as date,
        COALESCE(SUM(visit_total_revenue), 0) as revenue,
        COUNT(*) as bills_count,
        COALESCE(SUM(consultation_revenue), 0) as consultation_revenue,
        COALESCE(SUM(lab_revenue), 0) as lab_revenue,
        COALESCE(SUM(pharmacy_revenue), 0) as pharmacy_revenue,
        COALESCE(SUM(paid_revenue), 0) as paid_revenue,
        COALESCE(SUM(pending_revenue), 0) as pending_revenue
      FROM (${visitSummaryQuery}) visit_summary
      GROUP BY ${groupByFormat}
      ORDER BY date DESC
      LIMIT 100
    `;

      const expensesQuery = `
      SELECT 
        ${expenseGroupByFormat} as date,
        COALESCE(SUM(amount), 0) as expenses
      FROM expenses
      WHERE ${expenseDateFilter}
      ${hospitalId ? 'AND hospital_id = ?' : ''}
      GROUP BY ${expenseGroupByFormat}
      ORDER BY date DESC
    `;

      const revenueParams = hospitalId ? [hospitalId] : [];
      const expenseParams = hospitalId ? [hospitalId] : [];

      const [revenueResults] = await db.query(query, revenueParams);
      const [expenseResults] = await db.query(expensesQuery, expenseParams);

      // Merge logic: Create a map of revenues and expenses by date, then combine
      const statsMap = new Map();

      // Process revenue
      revenueResults.forEach(row => {
        // Normalize date string depending on format (YYYY-MM-DD or YYYY-MM)
        const dateKey = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
        statsMap.set(dateKey, {
          date: dateKey,
          ...row,
          expenses: 0,
          profit: parseFloat(row.revenue || 0)
        });
      });

      // Process expenses
      expenseResults.forEach(row => {
        const dateKey = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
        if (statsMap.has(dateKey)) {
          const existing = statsMap.get(dateKey);
          existing.expenses = parseFloat(row.expenses || 0);
          existing.profit = parseFloat(existing.revenue || 0) - parseFloat(row.expenses || 0);
          statsMap.set(dateKey, existing);
        } else {
          // Date exists in expenses but not revenue (e.g. paying bills on a Sunday with no patients)
          statsMap.set(dateKey, {
            date: dateKey,
            revenue: 0,
            bills_count: 0,
            consultation_revenue: 0,
            lab_revenue: 0,
            pharmacy_revenue: 0,
            paid_revenue: 0,
            pending_revenue: 0,
            expenses: parseFloat(row.expenses || 0),
            profit: 0 - parseFloat(row.expenses || 0)
          });
        }
      });

      // Convert map to array and sort
      const finalStats = Array.from(statsMap.values())
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json({ success: true, revenueStats: finalStats });

    } catch (error) {
      console.error('Revenue stats error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch revenue stats",
        details: error.message
      });
    }
  },

  // Get patient statistics
  getPatientStats: async (req, res) => {
    try {
      const { period = '30days' } = req.query;

      let dateFilter = "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";

      if (period === '7days') {
        dateFilter = "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
      } else if (period === '90days') {
        dateFilter = "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)";
      } else if (period === '12months') {
        dateFilter = "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
      }

      const queries = {
        patientGrowth: `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as patient_count
          FROM patients
          WHERE ${dateFilter}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `,

        genderDistribution: `
          SELECT 
            gender,
            COUNT(*) as count
          FROM patients
          GROUP BY gender
        `,

        ageDistribution: `
          SELECT 
            CASE 
              WHEN age < 18 THEN 'Under 18'
              WHEN age BETWEEN 18 AND 30 THEN '18-30'
              WHEN age BETWEEN 31 AND 50 THEN '31-50'
              WHEN age BETWEEN 51 AND 70 THEN '51-70'
              ELSE 'Over 70'
            END as age_group,
            COUNT(*) as count
          FROM patients
          GROUP BY age_group
          ORDER BY 
            CASE age_group
              WHEN 'Under 18' THEN 1
              WHEN '18-30' THEN 2
              WHEN '31-50' THEN 3
              WHEN '51-70' THEN 4
              ELSE 5
            END
        `
      };

      const [
        [patientGrowth],
        [genderDistribution],
        [ageDistribution]
      ] = await Promise.all([
        db.query(queries.patientGrowth, []),
        db.query(queries.genderDistribution, []),
        db.query(queries.ageDistribution, [])
      ]);

      res.json({
        success: true,
        patientStats: {
          growth: patientGrowth,
          genderDistribution,
          ageDistribution
        }
      });

    } catch (error) {
      console.error('Patient stats error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch patient stats",
        details: error.message
      });
    }
  },

  // Get department statistics
  getDepartmentStats: async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const hospitalId = req.user?.hospital_id;
      const todayVisitSummaryQuery = buildVisitSummarySubquery({
        hospitalId,
        dateCondition: 'DATE(b.created_at) = ?'
      });

      const queries = {
        queueStats: `
          SELECT 
            department,
            status,
            COUNT(*) as count
          FROM queue
          WHERE DATE(created_at) = ?
          ${hospitalId ? 'AND hospital_id = ?' : ''}
          GROUP BY department, status
        `,

        departmentRevenue: `
          SELECT 
            'Consultation' as department,
            COALESCE(SUM(consultation_revenue), 0) as revenue
          FROM (${todayVisitSummaryQuery}) visit_summary
          UNION ALL
          SELECT 
            'Laboratory' as department,
            COALESCE(SUM(lab_revenue), 0) as revenue
          FROM (${todayVisitSummaryQuery}) visit_summary
          UNION ALL
          SELECT 
            'Pharmacy' as department,
            COALESCE(SUM(pharmacy_revenue), 0) as revenue
          FROM (${todayVisitSummaryQuery}) visit_summary
        `
      };

      const [
        [queueStats],
        [departmentRevenue]
      ] = await Promise.all([
        db.query(queries.queueStats, hospitalId ? [today, hospitalId] : [today]),
        db.query(
          queries.departmentRevenue,
          hospitalId ? [today, hospitalId, today, hospitalId, today, hospitalId] : [today, today, today]
        )
      ]);

      res.json({
        success: true,
        departmentStats: {
          queue: queueStats,
          revenue: departmentRevenue
        }
      });

    } catch (error) {
      console.error('Department stats error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch department statistics",
        details: error.message
      });
    }
  },

  // Get inventory stats
  getInventoryStats: async (req, res) => {
    try {
      const queries = {
        lowStock: `
          SELECT COUNT(*) as count
          FROM medicines
          WHERE stock < 10
        `,

        expiringSoon: `
          SELECT COUNT(*) as count
          FROM medicines
          WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
          AND expiry_date >= CURDATE()
        `,

        expired: `
          SELECT COUNT(*) as count
          FROM medicines
          WHERE expiry_date < CURDATE()
        `,

        totalMedicines: `
          SELECT COUNT(*) as count
          FROM medicines
        `
      };

      const [
        [lowStock],
        [expiringSoon],
        [expired],
        [totalMedicines]
      ] = await Promise.all([
        db.query(queries.lowStock, []),
        db.query(queries.expiringSoon, []),
        db.query(queries.expired, []),
        db.query(queries.totalMedicines, [])
      ]);

      res.json({
        success: true,
        inventoryStats: {
          lowStock: lowStock[0]?.count || 0,
          expiringSoon: expiringSoon[0]?.count || 0,
          expired: expired[0]?.count || 0,
          total: totalMedicines[0]?.count || 0
        }
      });

    } catch (error) {
      console.error('Inventory stats error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch inventory statistics",
        details: error.message
      });
    }
  }
};

// Helper function to calculate time ago
function getTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

module.exports = adminController;
