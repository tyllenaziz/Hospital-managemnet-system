const test = require('node:test');
const assert = require('node:assert/strict');

const PatientNumberService = require('../services/PatientNumberService');

test('formats patient numbers according to hospital settings and selected pattern', () => {
  const service = new PatientNumberService({});
  const year = new Date().getFullYear();

  assert.equal(
    service.formatPatientNumber(42, { prefix: 'KNH', padding: 4, format: 'PREFIX-SEQUENCE' }),
    'KNH-0042'
  );
  assert.equal(
    service.formatPatientNumber(7, { prefix: 'MTR', padding: 3, format: 'YEAR-PREFIX-SEQUENCE' }),
    `${year}-MTR-007`
  );
  assert.equal(
    service.formatPatientNumber(12, { prefix: 'LAB', padding: 5, format: 'SEQUENCE' }),
    '00012'
  );
  assert.equal(
    service.formatPatientNumber(3, { prefix: 'ABC', padding: 2, format: 'CUSTOM', includeYear: true }),
    `ABC-${year}-03`
  );
});

test('generateNextPatientNumber locks sequence, increments it, and commits transaction', async () => {
  const calls = [];
  const transaction = {
    commit: async () => calls.push(['commit']),
    rollback: async () => calls.push(['rollback'])
  };
  const sequelize = {
    QueryTypes: { SELECT: 'SELECT' },
    transaction: async () => transaction,
    query: async (sql, options = {}) => {
      calls.push([sql.replace(/\s+/g, ' ').trim(), options]);
      if (sql.includes("setting_key = 'patient_number_next'")) {
        assert.equal(options.transaction, transaction);
        return [{ setting_value: '15' }];
      }
      if (sql.includes('SELECT setting_key, setting_value')) {
        return [[
          { setting_key: 'patient_number_prefix', setting_value: 'TEN' },
          { setting_key: 'patient_number_format', setting_value: 'PREFIX-SEQUENCE' },
          { setting_key: 'patient_number_padding', setting_value: '4' },
          { setting_key: 'patient_number_start', setting_value: '1' },
          { setting_key: 'patient_number_next', setting_value: '15' },
          { setting_key: 'patient_number_include_year', setting_value: 'false' }
        ]];
      }
      if (sql.includes('UPDATE system_settings')) {
        assert.equal(options.replacements.nextValue, '16');
        assert.equal(options.transaction, transaction);
        return [{}];
      }
      throw new Error(`Unexpected query: ${sql}`);
    }
  };

  const service = new PatientNumberService(sequelize);
  const generated = await service.generateNextPatientNumber(9);

  assert.equal(generated, 'TEN-0015');
  assert.equal(calls.some(([sql]) => sql.includes('FOR UPDATE')), true);
  assert.equal(calls.some(([sql]) => sql.includes('UPDATE system_settings')), true);
  assert.deepEqual(calls.at(-1), ['commit']);
});

test('generateNextPatientNumber rolls back when increment fails', async () => {
  let updateAttempted = false;
  const transaction = {
    commit: async () => assert.fail('commit should not be called after an update failure'),
    rollback: async () => { updateAttempted = true; }
  };
  const sequelize = {
    QueryTypes: { SELECT: 'SELECT' },
    transaction: async () => transaction,
    query: async (sql) => {
      if (sql.includes('UPDATE system_settings')) throw new Error('database write failed');
      if (sql.includes("setting_key = 'patient_number_next'")) return [{ setting_value: '2' }];
      if (sql.includes('SELECT setting_key, setting_value')) return [[]];
      throw new Error(`Unexpected query: ${sql}`);
    }
  };

  const service = new PatientNumberService(sequelize);
  await assert.rejects(() => service.generateNextPatientNumber(3), /database write failed/);
  assert.equal(updateAttempted, true);
});
