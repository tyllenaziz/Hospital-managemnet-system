const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const controllerPath = path.resolve(__dirname, '../controllers/patientController.js');
const patientPath = path.resolve(__dirname, '../models/Patient.js');
const queuePath = path.resolve(__dirname, '../models/Queue.js');
const dbPath = path.resolve(__dirname, '../config/dbconfig.js');
const auditPath = path.resolve(__dirname, '../utils/auditLogger.js');
const billPath = path.resolve(__dirname, '../models/Bill.js');

function mockModule(modulePath, exports) {
  require.cache[modulePath] = { id: modulePath, filename: modulePath, loaded: true, exports };
}

function loadController({ Patient, Queue = {}, db = {}, auditLogger = {}, Bill = {} }) {
  [controllerPath, patientPath, queuePath, dbPath, auditPath, billPath].forEach((modulePath) => {
    delete require.cache[modulePath];
  });
  mockModule(patientPath, Patient);
  mockModule(queuePath, Queue);
  mockModule(dbPath, db);
  mockModule(auditPath, auditLogger);
  mockModule(billPath, Bill);
  return require(controllerPath);
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

const validBody = {
  name: ' Jane Doe ',
  phone: '0712345678',
  age: '34',
  gender: 'female',
  id_number: 'ID-100',
  email: 'jane@example.com',
  initial_queue: 'doctor'
};

test('register rejects invalid queue destinations before creating patient records', async () => {
  const Patient = {
    findByIdNumber: async () => assert.fail('duplicate lookup should not run for invalid queue')
  };
  const controller = loadController({ Patient });
  const res = createResponse();

  await controller.register({ body: { ...validBody, initial_queue: 'billing' }, user: { hospital_id: 12 } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.error, /nurse.*doctor/);
});

test('register checks duplicates inside the authenticated hospital tenant', async () => {
  const calls = [];
  const Patient = {
    findByIdNumber: async (idNumber, hospitalId) => {
      calls.push(['findByIdNumber', idNumber, hospitalId]);
      return { id: 3, patient_number: 'TEN-003', name: 'Existing Patient', phone: '0711111111' };
    },
    findByPhone: async () => assert.fail('phone lookup should not run after ID duplicate')
  };
  const controller = loadController({ Patient });
  const res = createResponse();

  await controller.register({ body: validBody, user: { hospital_id: 12 } }, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, 'DUPLICATE_ENTRY');
  assert.equal(res.body.existingPatient.patient_number, 'TEN-003');
  assert.deepEqual(calls, [['findByIdNumber', 'ID-100', 12]]);
});

test('register trims input, uses hospital code for patient number creation, queues the patient, and records audit event', async () => {
  const calls = [];
  const newPatient = { id: 44, name: 'Jane Doe', patient_number: 'TEN-001', phone: '0712345678' };
  const Patient = {
    findByIdNumber: async (idNumber, hospitalId) => { calls.push(['findByIdNumber', idNumber, hospitalId]); return null; },
    findByPhone: async (phone, hospitalId) => { calls.push(['findByPhone', phone, hospitalId]); return null; },
    findByEmail: async (email, hospitalId) => { calls.push(['findByEmail', email, hospitalId]); return null; },
    create: async (data, hospitalId, hospitalCode) => { calls.push(['create', data, hospitalId, hospitalCode]); return newPatient; }
  };
  const Queue = {
    addToQueue: async (patientId, department, hospitalId) => {
      calls.push(['addToQueue', patientId, department, hospitalId]);
      return { id: 88, queueNumber: 'D-001', department, status: 'waiting' };
    }
  };
  const db = {
    query: async (sql, params) => {
      calls.push(['db.query', sql, params]);
      return [[{ code: 'TEN' }]];
    }
  };
  const auditLogger = {
    logCreate: async (_req, entity, id, message, metadata) => {
      calls.push(['audit', entity, id, message, metadata]);
    }
  };
  const controller = loadController({ Patient, Queue, db, auditLogger });
  const res = createResponse();

  await controller.register({ body: validBody, user: { id: 99, hospital_id: 12 } }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.assigned_to, 'doctor');
  const createCall = calls.find(([name]) => name === 'create');
  assert.equal(createCall[1].name, 'Jane Doe');
  assert.equal(createCall[1].age, 34);
  assert.equal(createCall[2], 12);
  assert.equal(createCall[3], 'TEN');
  assert.deepEqual(calls.find(([name]) => name === 'addToQueue'), ['addToQueue', 44, 'doctor', 12]);
  assert.equal(calls.some(([name]) => name === 'audit'), true);
});

test('getById scopes patient lookup to the authenticated hospital and returns 404 when not found', async () => {
  const lookups = [];
  const Patient = {
    findById: async (id, hospitalId) => {
      lookups.push([id, hospitalId]);
      return null;
    }
  };
  const controller = loadController({ Patient });
  const res = createResponse();

  await controller.getById({ params: { id: '42' }, user: { hospital_id: 7 } }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(lookups, [['42', 7]]);
});

test.afterEach(() => {
  [controllerPath, patientPath, queuePath, dbPath, auditPath, billPath].forEach((modulePath) => {
    delete require.cache[modulePath];
  });
});
