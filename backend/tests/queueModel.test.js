const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const dbPath = path.resolve(__dirname, '../config/dbconfig.js');
const queuePath = path.resolve(__dirname, '../models/Queue.js');

function loadQueueWithMockDb(query) {
  delete require.cache[queuePath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: { query }
  };
  return require(queuePath);
}

test('addToQueue creates a hospital-scoped waiting queue item with a daily department number', async () => {
  const queries = [];
  const Queue = loadQueueWithMockDb(async (sql, params) => {
    queries.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
    if (sql.includes('SELECT COUNT(*)')) return [[{ count: 4 }]];
    if (sql.includes('INSERT INTO queue')) return [{ insertId: 77 }];
    throw new Error(`Unexpected SQL: ${sql}`);
  });

  const result = await Queue.addToQueue(23, 'doctor', 5);

  assert.deepEqual(result, {
    id: 77,
    queueNumber: 'D-005',
    department: 'doctor',
    status: 'waiting',
    hospital_id: 5
  });
  assert.deepEqual(queries[0].params, ['doctor', 5]);
  assert.match(queries[0].sql, /department = \? AND DATE\(created_at\) = CURDATE\(\) AND hospital_id = \?/);
  assert.deepEqual(queries[1].params, [23, 'doctor', 'D-005', 5]);
});

test('getByDepartment returns one latest queue row per patient while preserving status priority', async () => {
  const rows = [
    { id: 1, patient_id: 10, status: 'waiting', created_at: '2026-05-16T08:00:00.000Z' },
    { id: 2, patient_id: 10, status: 'waiting', created_at: '2026-05-16T09:00:00.000Z' },
    { id: 3, patient_id: 11, status: 'in_progress', created_at: '2026-05-16T07:00:00.000Z' },
    { id: 4, patient_id: 12, status: 'done', created_at: '2026-05-16T06:00:00.000Z' }
  ];
  const Queue = loadQueueWithMockDb(async (sql, params) => {
    assert.match(sql, /q\.hospital_id = \?/);
    assert.match(sql, /q\.status IN \('waiting', 'in_progress', 'done'\)/);
    assert.deepEqual(params, ['doctor', 5]);
    return [rows];
  });

  const result = await Queue.getByDepartment('doctor', null, 5);

  assert.deepEqual(result.map((row) => row.id), [2, 3, 4]);
});

test.afterEach(() => {
  delete require.cache[queuePath];
  delete require.cache[dbPath];
});
