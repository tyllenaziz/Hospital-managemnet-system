const db = require("../config/dbconfig");
const shaService = require("../services/shaService");
const auditLogger = require("../utils/auditLogger");

const insuranceController = {
    // ==================== INSURANCE PROVIDERS ====================

    /**
     * Get all insurance providers
     */
    getProviders: async (req, res) => {
        try {
            const [providers] = await db.query(
                `SELECT * FROM insurance_providers WHERE is_active = TRUE ORDER BY type, name`
            );
            res.json({ success: true, providers });
        } catch (error) {
            console.error('Get providers error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch providers' });
        }
    },

    // ==================== PATIENT INSURANCE ====================

    /**
     * Add insurance to a patient
     */
    addPatientInsurance: async (req, res) => {
        try {
            const {
                patient_id, provider_id, member_number, member_name, relationship,
                principal_member_number, principal_member_name, national_id, sha_id,
                scheme_name, scheme_type, coverage_start_date, coverage_end_date,
                annual_limit, copay_percentage, copay_fixed, is_primary
            } = req.body;

            // If setting as primary, unset other primary insurances
            if (is_primary) {
                await db.query(
                    `UPDATE patient_insurance SET is_primary = FALSE WHERE patient_id = ?`,
                    [patient_id]
                );
            }

            const [result] = await db.query(
                `INSERT INTO patient_insurance 
         (patient_id, provider_id, member_number, member_name, relationship,
          principal_member_number, principal_member_name, national_id, sha_id,
          scheme_name, scheme_type, coverage_start_date, coverage_end_date,
          annual_limit, copay_percentage, copay_fixed, is_primary, balance_remaining)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [patient_id, provider_id, member_number, member_name, relationship || 'self',
                    principal_member_number, principal_member_name, national_id, sha_id,
                    scheme_name, scheme_type || 'comprehensive', coverage_start_date, coverage_end_date,
                    annual_limit, copay_percentage || 0, copay_fixed || 0, is_primary !== false, annual_limit]
            );

            await auditLogger.logCreate(req, 'patient_insurance', result.insertId,
                `Added insurance ${member_number} for patient ${patient_id}`);

            res.json({
                success: true,
                message: 'Insurance added successfully',
                insuranceId: result.insertId
            });

        } catch (error) {
            console.error('Add patient insurance error:', error);
            res.status(500).json({ success: false, error: 'Failed to add insurance', details: error.message });
        }
    },

    /**
     * Get patient's insurance details
     */
    getPatientInsurance: async (req, res) => {
        try {
            const { patientId } = req.params;

            const [insurance] = await db.query(
                `SELECT pi.*, ip.code as provider_code, ip.name as provider_name, ip.type as provider_type
         FROM patient_insurance pi
         JOIN insurance_providers ip ON pi.provider_id = ip.id
         WHERE pi.patient_id = ? AND pi.is_active = TRUE
         ORDER BY pi.is_primary DESC`,
                [patientId]
            );

            res.json({ success: true, insurance });
        } catch (error) {
            console.error('Get patient insurance error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch patient insurance' });
        }
    },

    /**
     * Verify insurance eligibility
     */
    verifyEligibility: async (req, res) => {
        try {
            const { patient_insurance_id, national_id, member_number } = req.body;

            // Call SHA service
            const result = await shaService.verifyEligibility(national_id, member_number);

            if (result.success && result.data.eligible) {
                // Update patient insurance with verification data
                if (patient_insurance_id) {
                    await db.query(
                        `UPDATE patient_insurance SET 
              is_verified = TRUE,
              verified_at = NOW(),
              verified_by = ?,
              verification_response = ?,
              sha_id = COALESCE(sha_id, ?),
              scheme_name = COALESCE(?, scheme_name),
              annual_limit = COALESCE(?, annual_limit),
              balance_remaining = COALESCE(?, balance_remaining)
            WHERE id = ?`,
                        [
                            req.user.id,
                            JSON.stringify(result.data),
                            result.data.member?.sha_id,
                            result.data.coverage?.scheme_name,
                            result.data.coverage?.outpatient_limit,
                            result.data.coverage?.outpatient_balance,
                            patient_insurance_id
                        ]
                    );
                }

                await auditLogger.log({
                    req,
                    action: 'VERIFY',
                    entityType: 'patient_insurance',
                    entityId: patient_insurance_id,
                    description: `Insurance verified for member ${member_number}`,
                    newValues: { eligible: true, source: result.source }
                });
            }

            res.json({
                success: true,
                verified: result.data?.eligible || false,
                data: result.data,
                source: result.source
            });

        } catch (error) {
            console.error('Verify eligibility error:', error);
            res.status(500).json({ success: false, error: 'Eligibility verification failed' });
        }
    },

    // ==================== CLAIMS ====================

    /**
     * Create a new claim
     */
    createClaim: async (req, res) => {
        try {
            const {
                patient_id, patient_insurance_id, claim_type, service_date,
                primary_diagnosis_code, primary_diagnosis_description,
                items // Array of claim items
            } = req.body;

            // Validate patient insurance
            const [insurance] = await db.query(
                `SELECT pi.*, ip.id as provider_id FROM patient_insurance pi
         JOIN insurance_providers ip ON pi.provider_id = ip.id
         WHERE pi.id = ? AND pi.is_active = TRUE`,
                [patient_insurance_id]
            );

            if (insurance.length === 0) {
                return res.status(400).json({ success: false, error: 'Invalid or inactive insurance' });
            }

            // Generate claim number
            const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            // Calculate totals
            let totalAmount = 0;
            if (items && items.length > 0) {
                totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
            }

            // Create claim
            const [claimResult] = await db.query(
                `INSERT INTO insurance_claims 
         (claim_number, patient_id, patient_insurance_id, provider_id, claim_type,
          service_date, primary_diagnosis_code, primary_diagnosis_description,
          total_amount, claimed_amount, status, created_by, hospital_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
                [claimNumber, patient_id, patient_insurance_id, insurance[0].provider_id,
                    claim_type, service_date, primary_diagnosis_code, primary_diagnosis_description,
                    totalAmount, totalAmount, req.user.id, req.user.hospital_id]
            );

            const claimId = claimResult.insertId;

            // Add claim items
            if (items && items.length > 0) {
                for (const item of items) {
                    await db.query(
                        `INSERT INTO claim_items 
             (claim_id, item_type, reference_type, reference_id, item_code,
              item_name, item_description, quantity, unit_price, total_price)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [claimId, item.item_type, item.reference_type, item.reference_id,
                            item.item_code, item.item_name, item.item_description,
                            item.quantity || 1, item.unit_price, item.total_price]
                    );
                }
            }

            await auditLogger.logCreate(req, 'insurance_claim', claimId,
                `Created claim ${claimNumber} for patient ${patient_id}`, { total: totalAmount });

            res.json({
                success: true,
                message: 'Claim created successfully',
                claimId,
                claimNumber
            });

        } catch (error) {
            console.error('Create claim error:', error);
            res.status(500).json({ success: false, error: 'Failed to create claim', details: error.message });
        }
    },

    /**
     * Get claims list with filters
     */
    getClaims: async (req, res) => {
        try {
            const { page = 1, limit = 20, status, providerId, patientId, startDate, endDate } = req.query;
            const offset = (page - 1) * limit;

            let whereConditions = ['ic.hospital_id = ?'];
            let params = [req.user.hospital_id];

            if (status) {
                whereConditions.push('ic.status = ?');
                params.push(status);
            }
            if (providerId) {
                whereConditions.push('ic.provider_id = ?');
                params.push(providerId);
            }
            if (patientId) {
                whereConditions.push('ic.patient_id = ?');
                params.push(patientId);
            }
            if (startDate) {
                whereConditions.push('DATE(ic.service_date) >= ?');
                params.push(startDate);
            }
            if (endDate) {
                whereConditions.push('DATE(ic.service_date) <= ?');
                params.push(endDate);
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            const [claims] = await db.query(
                `SELECT ic.*, p.name as patient_name, ip.code as provider_code, ip.name as provider_name,
                pi.member_number
         FROM insurance_claims ic
         JOIN patients p ON ic.patient_id = p.id
         JOIN insurance_providers ip ON ic.provider_id = ip.id
         JOIN patient_insurance pi ON ic.patient_insurance_id = pi.id
         ${whereClause}
         ORDER BY ic.created_at DESC
         LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), parseInt(offset)]
            );

            const [countResult] = await db.query(
                `SELECT COUNT(*) as total FROM insurance_claims ic ${whereClause}`,
                params
            );

            res.json({
                success: true,
                claims,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0]?.total || 0,
                    totalPages: Math.ceil((countResult[0]?.total || 0) / limit)
                }
            });

        } catch (error) {
            console.error('Get claims error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch claims' });
        }
    },

    /**
     * Get claim details with items
     */
    getClaimById: async (req, res) => {
        try {
            const { claimId } = req.params;

            const [claims] = await db.query(
                `SELECT ic.*, p.name as patient_name, p.phone as patient_phone,
                ip.code as provider_code, ip.name as provider_name,
                pi.member_number, pi.member_name, pi.national_id
         FROM insurance_claims ic
         JOIN patients p ON ic.patient_id = p.id
         JOIN insurance_providers ip ON ic.provider_id = ip.id
         JOIN patient_insurance pi ON ic.patient_insurance_id = pi.id
         WHERE ic.id = ? AND ic.hospital_id = ?`,
                [claimId, req.user.hospital_id]
            );

            if (claims.length === 0) {
                return res.status(404).json({ success: false, error: 'Claim not found' });
            }

            const [items] = await db.query(
                `SELECT * FROM claim_items WHERE claim_id = ?`,
                [claimId]
            );

            res.json({
                success: true,
                claim: claims[0],
                items
            });

        } catch (error) {
            console.error('Get claim error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch claim' });
        }
    },

    /**
     * Submit claim to insurer
     */
    submitClaim: async (req, res) => {
        try {
            const { claimId } = req.params;

            // Get claim details
            const [claims] = await db.query(
                `SELECT ic.*, pi.member_number, pi.national_id, pi.sha_id,
                ip.code as provider_code
         FROM insurance_claims ic
         JOIN patient_insurance pi ON ic.patient_insurance_id = pi.id
         JOIN insurance_providers ip ON ic.provider_id = ip.id
         WHERE ic.id = ?`,
                [claimId]
            );

            if (claims.length === 0) {
                return res.status(404).json({ success: false, error: 'Claim not found' });
            }

            const claim = claims[0];

            if (claim.status !== 'draft' && claim.status !== 'pending') {
                return res.status(400).json({ success: false, error: 'Claim already submitted' });
            }

            // Get claim items
            const [items] = await db.query(
                `SELECT * FROM claim_items WHERE claim_id = ?`,
                [claimId]
            );

            // Submit to SHA if government insurer
            let externalResult = null;
            if (['SHA', 'NHIF', 'SHIF'].includes(claim.provider_code)) {
                externalResult = await shaService.submitClaim({
                    claim_number: claim.claim_number,
                    member_number: claim.member_number,
                    national_id: claim.national_id,
                    service_date: claim.service_date,
                    diagnosis_code: claim.primary_diagnosis_code,
                    diagnosis_description: claim.primary_diagnosis_description,
                    total_amount: claim.total_amount,
                    items: items
                });
            }

            // Update claim status
            await db.query(
                `UPDATE insurance_claims SET 
          status = 'submitted',
          submitted_at = NOW(),
          submitted_by = ?,
          external_claim_id = ?
         WHERE id = ?`,
                [req.user.id, externalResult?.data?.claim_id || null, claimId]
            );

            await auditLogger.log({
                req,
                action: 'SUBMIT',
                entityType: 'insurance_claim',
                entityId: claimId,
                description: `Submitted claim ${claim.claim_number}`,
                newValues: { external_claim_id: externalResult?.data?.claim_id }
            });

            res.json({
                success: true,
                message: 'Claim submitted successfully',
                externalClaimId: externalResult?.data?.claim_id,
                source: externalResult?.source
            });

        } catch (error) {
            console.error('Submit claim error:', error);
            res.status(500).json({ success: false, error: 'Failed to submit claim' });
        }
    },

    /**
     * Update claim status (for internal status updates and responses)
     */
    updateClaimStatus: async (req, res) => {
        try {
            const { claimId } = req.params;
            const { status, approved_amount, rejection_reason, adjudication_notes,
                payment_date, payment_reference, payment_amount } = req.body;

            await db.query(
                `UPDATE insurance_claims SET 
          status = COALESCE(?, status),
          approved_amount = COALESCE(?, approved_amount),
          rejection_reason = COALESCE(?, rejection_reason),
          adjudication_notes = COALESCE(?, adjudication_notes),
          payment_date = COALESCE(?, payment_date),
          payment_reference = COALESCE(?, payment_reference),
          payment_amount = COALESCE(?, payment_amount),
          processed_at = CASE WHEN ? IN ('approved', 'rejected', 'partially_approved') THEN NOW() ELSE processed_at END
         WHERE id = ?`,
                [status, approved_amount, rejection_reason, adjudication_notes,
                    payment_date, payment_reference, payment_amount, status, claimId]
            );

            await auditLogger.logUpdate(req, 'insurance_claim', claimId,
                `Updated claim status to ${status}`);

            res.json({ success: true, message: 'Claim updated successfully' });

        } catch (error) {
            console.error('Update claim status error:', error);
            res.status(500).json({ success: false, error: 'Failed to update claim' });
        }
    },

    // ==================== PRE-AUTHORIZATION ====================

    /**
     * Create pre-authorization request
     */
    createPreAuth: async (req, res) => {
        try {
            const {
                patient_id, patient_insurance_id, request_type,
                primary_diagnosis_code, primary_diagnosis, procedure_code, procedure_description,
                clinical_notes, estimated_cost, estimated_days,
                admission_date, expected_discharge_date, treating_doctor, ward_type
            } = req.body;

            // Get insurance details
            const [insurance] = await db.query(
                `SELECT pi.*, ip.id as provider_id FROM patient_insurance pi
         JOIN insurance_providers ip ON pi.provider_id = ip.id
         WHERE pi.id = ?`,
                [patient_insurance_id]
            );

            if (insurance.length === 0) {
                return res.status(400).json({ success: false, error: 'Invalid insurance' });
            }

            // Generate pre-auth number
            const preauthNumber = `PA-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

            const [result] = await db.query(
                `INSERT INTO preauthorizations 
         (preauth_number, patient_id, patient_insurance_id, provider_id, request_type,
          primary_diagnosis_code, primary_diagnosis, procedure_code, procedure_description,
          clinical_notes, estimated_cost, estimated_days, admission_date, expected_discharge_date,
          treating_doctor, ward_type, status, requested_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
                [preauthNumber, patient_id, patient_insurance_id, insurance[0].provider_id,
                    request_type, primary_diagnosis_code, primary_diagnosis, procedure_code,
                    procedure_description, clinical_notes, estimated_cost, estimated_days,
                    admission_date, expected_discharge_date, treating_doctor, ward_type || 'general',
                    req.user.id]
            );

            await auditLogger.logCreate(req, 'preauthorization', result.insertId,
                `Created pre-auth request ${preauthNumber}`);

            res.json({
                success: true,
                message: 'Pre-authorization request created',
                preauthId: result.insertId,
                preauthNumber
            });

        } catch (error) {
            console.error('Create pre-auth error:', error);
            res.status(500).json({ success: false, error: 'Failed to create pre-authorization' });
        }
    },

    /**
     * Get pre-authorizations list
     */
    getPreAuths: async (req, res) => {
        try {
            const { status, patientId, providerId } = req.query;

            let whereConditions = ['pa.hospital_id = ?'];
            let params = [req.user.hospital_id];

            if (status) {
                whereConditions.push('pa.status = ?');
                params.push(status);
            }
            if (patientId) {
                whereConditions.push('pa.patient_id = ?');
                params.push(patientId);
            }
            if (providerId) {
                whereConditions.push('pa.provider_id = ?');
                params.push(providerId);
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            const [preauths] = await db.query(
                `SELECT pa.*, p.name as patient_name, ip.code as provider_code, ip.name as provider_name,
                pi.member_number
         FROM preauthorizations pa
         JOIN patients p ON pa.patient_id = p.id
         JOIN insurance_providers ip ON pa.provider_id = ip.id
         JOIN patient_insurance pi ON pa.patient_insurance_id = pi.id
         ${whereClause}
         ORDER BY pa.created_at DESC`,
                params
            );

            res.json({ success: true, preauths });

        } catch (error) {
            console.error('Get pre-auths error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch pre-authorizations' });
        }
    },

    /**
     * Submit pre-auth to insurer
     */
    submitPreAuth: async (req, res) => {
        try {
            const { preauthId } = req.params;

            const [preauths] = await db.query(
                `SELECT pa.*, pi.member_number, pi.national_id
         FROM preauthorizations pa
         JOIN patient_insurance pi ON pa.patient_insurance_id = pi.id
         WHERE pa.id = ?`,
                [preauthId]
            );

            if (preauths.length === 0) {
                return res.status(404).json({ success: false, error: 'Pre-authorization not found' });
            }

            const preauth = preauths[0];

            // Submit to SHA
            const result = await shaService.requestPreAuth({
                preauth_number: preauth.preauth_number,
                member_number: preauth.member_number,
                national_id: preauth.national_id,
                request_type: preauth.request_type,
                diagnosis: preauth.primary_diagnosis,
                procedure: preauth.procedure_description,
                estimated_cost: preauth.estimated_cost,
                admission_date: preauth.admission_date
            });

            await db.query(
                `UPDATE preauthorizations SET 
          status = 'submitted',
          external_preauth_id = ?
         WHERE id = ?`,
                [result.data?.preauth_id || null, preauthId]
            );

            res.json({
                success: true,
                message: 'Pre-authorization submitted',
                externalPreauthId: result.data?.preauth_id,
                source: result.source
            });

        } catch (error) {
            console.error('Submit pre-auth error:', error);
            res.status(500).json({ success: false, error: 'Failed to submit pre-authorization' });
        }
    },

    // ==================== DASHBOARD & REPORTS ====================

    /**
     * Get insurance dashboard stats
     */
    getDashboardStats: async (req, res) => {
        try {
            // Claims summary
            const [claimsSummary] = await db.query(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(claimed_amount) as total_claimed,
          SUM(approved_amount) as total_approved,
          SUM(payment_amount) as total_paid
        FROM insurance_claims
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND hospital_id = ?
        GROUP BY status
      `, [req.user.hospital_id]);

            // By provider
            const [byProvider] = await db.query(`
        SELECT 
          ip.code,
          ip.name,
          COUNT(*) as claim_count,
          SUM(ic.claimed_amount) as total_claimed,
          SUM(ic.approved_amount) as total_approved
        FROM insurance_claims ic
        JOIN insurance_providers ip ON ic.provider_id = ip.id
        WHERE ic.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND ic.hospital_id = ?
        GROUP BY ip.id, ip.code, ip.name
        ORDER BY total_claimed DESC
      `, [req.user.hospital_id]);

            // Pending pre-auths
            const [pendingPreauths] = await db.query(`
        SELECT COUNT(*) as count FROM preauthorizations
        WHERE status IN ('pending', 'submitted', 'under_review') AND hospital_id = ?
      `, [req.user.hospital_id]);

            // Outstanding claims (aging)
            const [aging] = await db.query(`
        SELECT 
          CASE 
            WHEN DATEDIFF(NOW(), submitted_at) <= 14 THEN '0-14 days'
            WHEN DATEDIFF(NOW(), submitted_at) <= 30 THEN '15-30 days'
            WHEN DATEDIFF(NOW(), submitted_at) <= 60 THEN '31-60 days'
            ELSE '60+ days'
          END as age_bucket,
          COUNT(*) as count,
          SUM(claimed_amount) as total
        FROM insurance_claims
        WHERE status IN ('submitted', 'processing') AND submitted_at IS NOT NULL AND hospital_id = ?
        GROUP BY age_bucket
      `, [req.user.hospital_id]);

            res.json({
                success: true,
                stats: {
                    claimsSummary,
                    byProvider,
                    pendingPreauths: pendingPreauths[0]?.count || 0,
                    aging
                }
            });

        } catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
        }
    }
};

module.exports = insuranceController;
