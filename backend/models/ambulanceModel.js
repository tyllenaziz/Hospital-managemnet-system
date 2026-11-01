const db = require('../config/dbconfig');

const ambulanceModel = {
  // Ambulance Methods
  async getAllAmbulances(hospitalId) {
    try {
      const [ambulances] = await db.query('SELECT * FROM ambulances WHERE hospital_id = ? ORDER BY created_at DESC', [hospitalId]);
      return ambulances;
    } catch (error) {
      throw new Error(`Error fetching ambulances: ${error.message}`);
    }
  },

  async getAvailableAmbulances(hospitalId) {
    try {
      const [ambulances] = await db.query(
        'SELECT * FROM ambulances WHERE status = "Available" AND hospital_id = ? ORDER BY created_at DESC',
        [hospitalId]
      );
      return ambulances;
    } catch (error) {
      throw new Error(`Error fetching available ambulances: ${error.message}`);
    }
  },

  async getAmbulanceById(id, hospitalId) {
    try {
      const [ambulances] = await db.query('SELECT * FROM ambulances WHERE id = ? AND hospital_id = ?', [id, hospitalId]);
      return ambulances[0] || null;
    } catch (error) {
      throw new Error(`Error fetching ambulance: ${error.message}`);
    }
  },

  async createAmbulance(ambulanceData) {
    try {
      const {
        ambulance_number,
        type,
        driver_name,
        driver_phone,
        capacity,
        equipment,
        location,
        notes,
        status = 'Available'
      } = ambulanceData;

      const hospital_id = ambulanceData.hospital_id;
      const [result] = await db.query(
        `INSERT INTO ambulances 
         (ambulance_number, type, driver_name, driver_phone, capacity, equipment, location, notes, status, hospital_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ambulance_number,
          type,
          driver_name,
          driver_phone,
          capacity,
          JSON.stringify(equipment || []),
          location,
          notes,
          status,
          hospital_id
        ]
      );

      return { id: result.insertId, ...ambulanceData };
    } catch (error) {
      throw new Error(`Error creating ambulance: ${error.message}`);
    }
  },

  async updateAmbulance(id, ambulanceData, hospitalId) {
    try {
      const {
        ambulance_number,
        type,
        driver_name,
        driver_phone,
        capacity,
        equipment,
        location,
        notes,
        status
      } = ambulanceData;

      const [result] = await db.query(
        `UPDATE ambulances 
         SET ambulance_number = ?, type = ?, driver_name = ?, driver_phone = ?, 
             capacity = ?, equipment = ?, location = ?, notes = ?, status = ?
         WHERE id = ? AND hospital_id = ?`,
        [
          ambulance_number,
          type,
          driver_name,
          driver_phone,
          capacity,
          JSON.stringify(equipment || []),
          location,
          notes,
          status,
          id,
          hospitalId
        ]
      );

      if (result.affectedRows === 0) {
        throw new Error('Ambulance not found');
      }

      return { id, ...ambulanceData };
    } catch (error) {
      throw new Error(`Error updating ambulance: ${error.message}`);
    }
  },

  async updateAmbulanceStatus(id, status) {
    try {
      const [result] = await db.query(
        'UPDATE ambulances SET status = ? WHERE id = ?',
        [status, id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Ambulance not found');
      }

      return { id, status };
    } catch (error) {
      throw new Error(`Error updating ambulance status: ${error.message}`);
    }
  },

  async deleteAmbulance(id) {
    try {
      const [result] = await db.query('DELETE FROM ambulances WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        throw new Error('Ambulance not found');
      }

      return { id };
    } catch (error) {
      throw new Error(`Error deleting ambulance: ${error.message}`);
    }
  },

  // Ambulance Request Methods
  async getAllAmbulanceRequests(filters = {}, hospitalId) {
    try {
      let query = `
      SELECT ar.*, 
            COALESCE(ar.patient_name, p.name) as patient_name,
            COALESCE(ar.patient_phone, p.phone) as patient_phone, 
            COALESCE(ar.patient_age, p.age) as patient_age,
            COALESCE(ar.patient_gender, p.gender) as patient_gender,
            p.address,
            a.ambulance_number, a.type as ambulance_type,
            a.driver_name, a.driver_phone,
            ur.username as requested_by_name,
            ua.username as approved_by_name,
            up.username as printed_by_name
      FROM ambulance_requests ar
      LEFT JOIN patients p ON ar.patient_id = p.id
      LEFT JOIN ambulances a ON ar.ambulance_id = a.id
      LEFT JOIN users ur ON ar.requested_by = ur.id
      LEFT JOIN users ua ON ar.approved_by = ua.id
      LEFT JOIN users up ON ar.printed_by = up.id
      WHERE ar.hospital_id = ?
    `;
      const params = [hospitalId];

      if (filters.direction) {
        query += ' AND ar.request_direction = ?';
        params.push(filters.direction);
      }

      if (filters.status) {
        query += ' AND ar.status = ?';
        params.push(filters.status);
      }

      if (filters.type) {
        query += ' AND ar.request_type = ?';
        params.push(filters.type);
      }

      if (filters.priority) {
        query += ' AND ar.priority = ?';
        params.push(filters.priority);
      }

      // Filter by requester type
      if (filters.requester_type) {
        query += ' AND ar.requester_type = ?';
        params.push(filters.requester_type);
      }

      // Filter by date range
      if (filters.start_date && filters.end_date) {
        query += ' AND DATE(ar.created_at) BETWEEN ? AND ?';
        params.push(filters.start_date, filters.end_date);
      }

      query += ' ORDER BY ar.created_at DESC';

      const [requests] = await db.query(query, params);

      // Parse JSON fields
      return requests.map(request => this.parseRequestData(request));
    } catch (error) {
      throw new Error(`Error fetching ambulance requests: ${error.message}`);
    }
  },

  async getAmbulanceRequestById(id) {
    try {
      const [requests] = await db.query(
        `SELECT ar.*, 
                  COALESCE(ar.patient_name, p.name) as patient_name,
                  COALESCE(ar.patient_phone, p.phone) as patient_phone, 
                  COALESCE(ar.patient_age, p.age) as patient_age,
                  COALESCE(ar.patient_gender, p.gender) as patient_gender,
                  p.address,
                  a.ambulance_number, a.type as ambulance_type,
                  a.driver_name, a.driver_phone,
                  ur.username as requested_by_name,
                  ua.username as approved_by_name,
                  up.username as printed_by_name
          FROM ambulance_requests ar
          LEFT JOIN patients p ON ar.patient_id = p.id
          LEFT JOIN ambulances a ON ar.ambulance_id = a.id
          LEFT JOIN users ur ON ar.requested_by = ur.id
          LEFT JOIN users ua ON ar.approved_by = ua.id
          LEFT JOIN users up ON ar.printed_by = up.id
          WHERE ar.id = ?`,
        [id]
      );

      if (requests.length === 0) {
        return null;
      }

      return this.parseRequestData(requests[0]);
    } catch (error) {
      throw new Error(`Error fetching ambulance request: ${error.message}`);
    }
  },

  async createAmbulanceRequest(requestData) {
    try {
      const {
        patient_id,
        requested_by,
        request_direction = 'OUTGOING',
        requester_type = 'INTERNAL',
        request_type = 'Referral',
        priority = 'Medium',
        pickup_location = 'Hospital Main Entrance',
        pickup_location_details = '',
        destination,
        destination_details = '',
        patient_name,
        patient_age,
        patient_gender,
        patient_phone,
        patient_id_number = '',
        patient_condition = '',
        emergency_details = '',
        vital_signs = {},
        symptoms = [],
        medical_history = '',
        current_medications = '',
        allergies = '',
        required_equipment = [],
        special_instructions = '',
        ambulance_id = null,
        // External hospital fields
        requesting_hospital_name = null,
        requesting_hospital_location = null,
        requesting_hospital_contact = null,
        requesting_hospital_contact_person = null
      } = requestData;



      // Validate required fields based on requester type
      if (requester_type === 'EXTERNAL') {
        if (!requesting_hospital_name || !requesting_hospital_location ||
          !requesting_hospital_contact || !requesting_hospital_contact_person) {
          throw new Error('All referring hospital details are required for external requests');
        }
      } else {
        // For internal requests, patient details are required
        if (!patient_name || !patient_age || !patient_gender || !patient_phone) {
          throw new Error('All patient details are required for internal requests');
        }
      }

      // Common required fields for both types
      if (!destination) {
        throw new Error('Destination is required');
      }

      const hospital_id = requestData.hospital_id;
      const [result] = await db.query(
        `INSERT INTO ambulance_requests 
       (patient_id, requested_by, request_direction, requester_type, request_type, priority, ambulance_id,
        pickup_location, pickup_location_details, destination, destination_details,
        patient_name, patient_age, patient_gender, patient_phone, patient_id_number,
        patient_condition, emergency_details, vital_signs, symptoms, medical_history,
        current_medications, allergies, required_equipment, special_instructions,
        requesting_hospital_name, requesting_hospital_location, requesting_hospital_contact,
        requesting_hospital_contact_person, status, hospital_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patient_id || null,
          requested_by,
          request_direction,
          requester_type,
          request_type,
          priority,
          ambulance_id,
          pickup_location,
          pickup_location_details,
          destination,
          destination_details,
          patient_name,
          patient_age,
          patient_gender,
          patient_phone,
          patient_id_number,
          patient_condition,
          emergency_details,
          JSON.stringify(vital_signs || {}),
          JSON.stringify(symptoms || []),
          medical_history,
          current_medications,
          allergies,
          JSON.stringify(required_equipment || []),
          special_instructions,
          requesting_hospital_name,
          requesting_hospital_location,
          requesting_hospital_contact,
          requesting_hospital_contact_person,
          'Pending', // Default status
          hospital_id
        ]
      );



      // Return the created request with all data
      return {
        id: result.insertId,
        ...requestData,
        status: 'Pending'
      };
    } catch (error) {
      console.error('Database error in createAmbulanceRequest:', error);
      throw new Error(`Error creating ambulance request: ${error.message}`);
    }
  },

  async updateAmbulanceRequest(id, requestData) {
    try {
      const {
        status,
        doctor_notes,
        approved_by,
        printed_by,
        ambulance_id,
        assigned_driver,
        assigned_at,
        dispatch_time,
        completion_time,
        pickup_time
      } = requestData;

      let query = 'UPDATE ambulance_requests SET ';
      const params = [];
      const updates = [];

      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);

        // Set timestamp based on status
        if (status === 'Approved') {
          updates.push('approval_date = NOW()');
        } else if (status === 'Assigned') {
          updates.push('assigned_at = NOW()');
        } else if (status === 'Dispatched') {
          updates.push('dispatch_time = NOW()');
        } else if (status === 'Completed') {
          updates.push('completion_time = NOW()');
        } else if (status === 'At Pickup') {
          updates.push('pickup_time = NOW()');
        }
      }

      if (doctor_notes !== undefined) {
        updates.push('doctor_notes = ?');
        params.push(doctor_notes);
      }

      if (approved_by !== undefined) {
        updates.push('approved_by = ?');
        params.push(approved_by);
      }

      if (printed_by !== undefined) {
        updates.push('printed_by = ?, printed_at = NOW()');
        params.push(printed_by);
      }

      if (ambulance_id !== undefined) {
        updates.push('ambulance_id = ?');
        params.push(ambulance_id);
      }

      if (assigned_driver !== undefined) {
        updates.push('assigned_driver = ?');
        params.push(assigned_driver);
      }

      if (assigned_at !== undefined) {
        updates.push('assigned_at = ?');
        params.push(assigned_at);
      }

      if (dispatch_time !== undefined) {
        updates.push('dispatch_time = ?');
        params.push(dispatch_time);
      }

      if (completion_time !== undefined) {
        updates.push('completion_time = ?');
        params.push(completion_time);
      }

      if (pickup_time !== undefined) {
        updates.push('pickup_time = ?');
        params.push(pickup_time);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      query += updates.join(', ') + ' WHERE id = ?';
      params.push(id);

      const [result] = await db.query(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Ambulance request not found');
      }

      return { id, ...requestData };
    } catch (error) {
      throw new Error(`Error updating ambulance request: ${error.message}`);
    }
  },

  async approveAmbulanceRequest(id, approved_by, doctor_notes = '') {
    try {
      const [result] = await db.query(
        `UPDATE ambulance_requests 
         SET status = 'Approved', approved_by = ?, doctor_notes = ?, approval_date = NOW()
         WHERE id = ? AND status = 'Pending'`,
        [approved_by, doctor_notes, id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Request not found or already processed');
      }

      return { id, status: 'Approved', approved_by, doctor_notes };
    } catch (error) {
      throw new Error(`Error approving ambulance request: ${error.message}`);
    }
  },

  async markAsPrinted(id, printed_by) {
    try {
      const [result] = await db.query(
        `UPDATE ambulance_requests 
         SET printed_by = ?, printed_at = NOW()
         WHERE id = ? AND status = 'Approved'`,
        [printed_by, id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Request not found or not approved');
      }

      return { id, printed_by, printed_at: new Date() };
    } catch (error) {
      throw new Error(`Error marking request as printed: ${error.message}`);
    }
  },

  async assignAmbulanceToRequest(requestId, ambulanceId, assignedDriver = null) {
    try {
      const [result] = await db.query(
        `UPDATE ambulance_requests 
         SET ambulance_id = ?, status = 'Assigned', assigned_at = NOW(), assigned_driver = ?
         WHERE id = ? AND status = 'Approved'`,
        [ambulanceId, assignedDriver, requestId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Request not found or not approved');
      }

      // Update ambulance status
      await db.query(
        'UPDATE ambulances SET status = "On Trip" WHERE id = ?',
        [ambulanceId]
      );

      return { requestId, ambulanceId, status: 'Assigned', assignedDriver };
    } catch (error) {
      throw new Error(`Error assigning ambulance to request: ${error.message}`);
    }
  },

  async updateRequestStatus(id, status) {
    try {
      let timestampUpdate = '';

      // Set appropriate timestamp based on status
      if (status === 'Dispatched') {
        timestampUpdate = ', dispatch_time = NOW()';
      } else if (status === 'Completed') {
        timestampUpdate = ', completion_time = NOW()';
      } else if (status === 'At Pickup') {
        timestampUpdate = ', pickup_time = NOW()';
      } else if (status === 'Assigned') {
        timestampUpdate = ', assigned_at = NOW()';
      }

      const [result] = await db.query(
        `UPDATE ambulance_requests SET status = ? ${timestampUpdate} WHERE id = ?`,
        [status, id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Request not found');
      }

      return { id, status };
    } catch (error) {
      throw new Error(`Error updating request status: ${error.message}`);
    }
  },


  parseRequestData(request) {
    if (!request) return request;

    // Parse vital_signs
    if (request.vital_signs) {
      try {
        request.vital_signs = typeof request.vital_signs === 'string'
          ? JSON.parse(request.vital_signs)
          : request.vital_signs;
      } catch (e) {
        console.warn('Failed to parse vital_signs:', e);
        request.vital_signs = {};
      }
    } else {
      request.vital_signs = {};
    }

    // Parse symptoms
    if (request.symptoms) {
      try {
        request.symptoms = typeof request.symptoms === 'string'
          ? JSON.parse(request.symptoms)
          : request.symptoms;
      } catch (e) {
        console.warn('Failed to parse symptoms:', e);
        request.symptoms = [];
      }
    } else {
      request.symptoms = [];
    }

    // Parse required_equipment
    if (request.required_equipment) {
      try {
        request.required_equipment = typeof request.required_equipment === 'string'
          ? JSON.parse(request.required_equipment)
          : request.required_equipment;
      } catch (e) {
        console.warn('Failed to parse required_equipment:', e);
        request.required_equipment = [];
      }
    } else {
      request.required_equipment = [];
    }

    // Parse equipment (for ambulances)
    if (request.equipment && typeof request.equipment === 'string') {
      try {
        request.equipment = JSON.parse(request.equipment);
      } catch (e) {
        console.warn('Failed to parse equipment:', e);
        request.equipment = [];
      }
    }

    // Ensure external hospital fields are properly handled
    if (request.requester_type === 'EXTERNAL') {
      request.requesting_hospital_name = request.requesting_hospital_name || '';
      request.requesting_hospital_location = request.requesting_hospital_location || '';
      request.requesting_hospital_contact = request.requesting_hospital_contact || '';
      request.requesting_hospital_contact_person = request.requesting_hospital_contact_person || '';
    }

    return request;
  },

  // Get pending requests
  async getPendingRequests(hospitalId) {
    try {
      const [requests] = await db.query(
        `SELECT ar.*, 
                p.name as patient_name, p.phone as patient_phone,
                a.ambulance_number, a.driver_name,
                ur.username as requested_by_name
         FROM ambulance_requests ar
         LEFT JOIN patients p ON ar.patient_id = p.id
         LEFT JOIN ambulances a ON ar.ambulance_id = a.id
         LEFT JOIN users ur ON ar.requested_by = ur.id
         WHERE ar.status = 'Pending' AND ar.hospital_id = ?
         ORDER BY ar.created_at DESC`,
        [hospitalId]
      );

      return requests.map(request => this.parseRequestData(request));
    } catch (error) {
      throw new Error(`Error fetching pending requests: ${error.message}`);
    }
  },

  // Get requests by patient ID
  async getRequestsByPatientId(patientId) {
    try {
      const [requests] = await db.query(
        `SELECT ar.*, 
                a.ambulance_number, a.driver_name,
                ur.username as requested_by_name,
                ua.username as approved_by_name
         FROM ambulance_requests ar
         LEFT JOIN ambulances a ON ar.ambulance_id = a.id
         LEFT JOIN users ur ON ar.requested_by = ur.id
         LEFT JOIN users ua ON ar.approved_by = ua.id
         WHERE ar.patient_id = ?
         ORDER BY ar.created_at DESC`,
        [patientId]
      );

      return requests.map(request => this.parseRequestData(request));
    } catch (error) {
      throw new Error(`Error fetching patient ambulance requests: ${error.message}`);
    }
  },

  // Get ambulance request statistics
  async getRequestStats(hospitalId) {
    try {
      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_requests,
          SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_requests,
          SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) as assigned_requests,
          SUM(CASE WHEN status = 'Dispatched' THEN 1 ELSE 0 END) as dispatched_requests,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_requests,
          SUM(CASE WHEN request_direction = 'INCOMING' THEN 1 ELSE 0 END) as incoming_requests,
          SUM(CASE WHEN request_direction = 'OUTGOING' THEN 1 ELSE 0 END) as outgoing_requests,
          SUM(CASE WHEN requester_type = 'INTERNAL' THEN 1 ELSE 0 END) as internal_requests,
          SUM(CASE WHEN requester_type = 'EXTERNAL' THEN 1 ELSE 0 END) as external_requests,
          SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END) as critical_requests,
          SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as high_priority_requests
        FROM ambulance_requests
        WHERE DATE(created_at) = CURDATE() AND hospital_id = ?
      `, [hospitalId]);

      return stats[0] || {};
    } catch (error) {
      throw new Error(`Error fetching request stats: ${error.message}`);
    }
  },

  // Get requests by status
  async getRequestsByStatus(status) {
    try {
      const [requests] = await db.query(
        `SELECT ar.*, 
                p.name as patient_name, p.phone as patient_phone,
                a.ambulance_number, a.driver_name,
                ur.username as requested_by_name
         FROM ambulance_requests ar
         LEFT JOIN patients p ON ar.patient_id = p.id
         LEFT JOIN ambulances a ON ar.ambulance_id = a.id
         LEFT JOIN users ur ON ar.requested_by = ur.id
         WHERE ar.status = ?
         ORDER BY ar.created_at DESC`,
        [status]
      );

      return requests.map(request => this.parseRequestData(request));
    } catch (error) {
      throw new Error(`Error fetching ${status} requests: ${error.message}`);
    }
  },

  // Search ambulance requests
  async searchAmbulanceRequests(searchTerm) {
    try {
      const [requests] = await db.query(
        `SELECT ar.*, 
                p.name as patient_name, p.phone as patient_phone,
                a.ambulance_number, a.driver_name,
                ur.username as requested_by_name
         FROM ambulance_requests ar
         LEFT JOIN patients p ON ar.patient_id = p.id
         LEFT JOIN ambulances a ON ar.ambulance_id = a.id
         LEFT JOIN users ur ON ar.requested_by = ur.id
         WHERE p.name LIKE ? OR ar.destination LIKE ? OR ar.request_type LIKE ? 
         OR a.ambulance_number LIKE ? OR ar.requesting_hospital_name LIKE ?
         ORDER BY ar.created_at DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );

      return requests.map(request => this.parseRequestData(request));
    } catch (error) {
      throw new Error(`Error searching ambulance requests: ${error.message}`);
    }
  }
};

module.exports = ambulanceModel;