const db = require('../config/dbconfig');

const indexes = [
  {
    table: 'queue',
    name: 'idx_queue_hospital_dept_status_created',
    ddl: 'ALTER TABLE queue ADD INDEX idx_queue_hospital_dept_status_created (hospital_id, department, status, created_at)'
  },
  {
    table: 'bills',
    name: 'idx_bills_hospital_created_status',
    ddl: 'ALTER TABLE bills ADD INDEX idx_bills_hospital_created_status (hospital_id, created_at, payment_status)'
  },
  {
    table: 'prescriptions',
    name: 'idx_prescriptions_hospital_status_created',
    ddl: 'ALTER TABLE prescriptions ADD INDEX idx_prescriptions_hospital_status_created (hospital_id, status, created_at)'
  },
  {
    table: 'patients',
    name: 'idx_patients_hospital_created',
    ddl: 'ALTER TABLE patients ADD INDEX idx_patients_hospital_created (hospital_id, created_at)'
  }
];

async function indexExists(table, indexName) {
  const sql = `
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND index_name = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [table, indexName]);
  return rows.length > 0;
}

async function run() {
  try {
    for (const idx of indexes) {
      const exists = await indexExists(idx.table, idx.name);
      if (exists) {
        console.log(`✓ ${idx.name} already exists`);
        continue;
      }

      await db.query(idx.ddl);
      console.log(`✅ Created ${idx.name}`);
    }

    console.log('Hot-path index migration completed.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

run();
