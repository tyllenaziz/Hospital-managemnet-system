/**
 * Scoped Query Utility
 * 
 * Helper functions for building hospital-scoped SQL queries
 * to enforce multi-tenant data isolation.
 */

/**
 * Adds hospital_id filter to a SQL query.
 * Handles both WHERE and AND cases.
 * 
 * @param {string} sql - The SQL query string
 * @param {Array} params - The parameters array
 * @param {number|null} hospitalId - The hospital ID to filter by
 * @param {string} [alias] - Optional table alias (e.g., 'p' for patients)
 * @returns {{ sql: string, params: Array }} Updated SQL and params
 * 
 * @example
 * const { sql, params } = addHospitalFilter(
 *   'SELECT * FROM patients WHERE id = ?', [1], hospitalId, null
 * );
 * // Result: 'SELECT * FROM patients WHERE id = ? AND hospital_id = ?', [1, hospitalId]
 */
const addHospitalFilter = (sql, params, hospitalId, alias = null) => {
    if (!hospitalId) return { sql, params };

    const column = alias ? `${alias}.hospital_id` : 'hospital_id';

    // Check if query already has a WHERE clause
    const hasWhere = /\bWHERE\b/i.test(sql);

    if (hasWhere) {
        sql += ` AND ${column} = ?`;
    } else {
        sql += ` WHERE ${column} = ?`;
    }

    params.push(hospitalId);
    return { sql, params };
};

/**
 * Builds a WHERE clause from an array of conditions.
 * 
 * @param {Array<{condition: string, value: any}>} conditions - Array of condition objects
 * @returns {{ whereClause: string, params: Array }}
 * 
 * @example
 * const { whereClause, params } = buildWhereClause([
 *   { condition: 'hospital_id = ?', value: 1 },
 *   { condition: 'status = ?', value: 'active' }
 * ]);
 * // Result: 'WHERE hospital_id = ? AND status = ?', [1, 'active']
 */
const buildWhereClause = (conditions) => {
    const validConditions = conditions.filter(c => c.value !== undefined && c.value !== null);

    if (validConditions.length === 0) {
        return { whereClause: '', params: [] };
    }

    const whereClause = 'WHERE ' + validConditions.map(c => c.condition).join(' AND ');
    const params = validConditions.map(c => c.value);

    return { whereClause, params };
};

/**
 * Prepends hospital_id as the first condition in a WHERE clause builder.
 * Useful for building scoped queries from scratch.
 * 
 * @param {number|null} hospitalId 
 * @param {string} [alias] - Optional table alias
 * @returns {{ conditions: Array, params: Array }}
 */
const startScopedConditions = (hospitalId, alias = null) => {
    const conditions = [];
    const params = [];

    if (hospitalId) {
        const column = alias ? `${alias}.hospital_id` : 'hospital_id';
        conditions.push(`${column} = ?`);
        params.push(hospitalId);
    }

    return { conditions, params };
};

module.exports = { addHospitalFilter, buildWhereClause, startScopedConditions };
