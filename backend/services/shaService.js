/**
 * SHA (Social Health Authority) Service
 * Mock-ready service for SHA API integration
 * 
 * When live SHA API is available, update the endpoints and authentication
 * API Documentation: https://developer.dha.go.ke
 */

const db = require("../config/dbconfig");

// SHA API Configuration (to be set in .env when live)
const SHA_CONFIG = {
    BASE_URL: process.env.SHA_API_URL || 'https://api.sha.go.ke/v1',
    API_KEY: process.env.SHA_API_KEY || '',
    FACILITY_CODE: process.env.SHA_FACILITY_CODE || 'DEMO-001',
    IS_MOCK: process.env.SHA_MOCK_MODE !== 'false' // Default to mock mode
};

const shaService = {
    /**
     * Verify member eligibility with SHA
     * @param {string} nationalId - Kenya National ID
     * @param {string} memberNumber - SHA/NHIF member number (optional)
     * @returns {Object} Eligibility status and member details
     */
    verifyEligibility: async (nationalId, memberNumber = null) => {
        if (SHA_CONFIG.IS_MOCK) {
            // Mock response for testing
            return shaService.mockEligibilityResponse(nationalId, memberNumber);
        }

        try {
            // Live API call (when available)
            const response = await fetch(`${SHA_CONFIG.BASE_URL}/members/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SHA_CONFIG.API_KEY}`,
                    'X-Facility-Code': SHA_CONFIG.FACILITY_CODE
                },
                body: JSON.stringify({
                    national_id: nationalId,
                    member_number: memberNumber
                })
            });

            const data = await response.json();
            return {
                success: response.ok,
                data: data,
                source: 'SHA_API'
            };
        } catch (error) {
            console.error('SHA API Error:', error);
            return {
                success: false,
                error: 'Failed to connect to SHA API',
                details: error.message
            };
        }
    },

    /**
     * Submit a claim to SHA
     */
    submitClaim: async (claimData) => {
        if (SHA_CONFIG.IS_MOCK) {
            return shaService.mockClaimSubmission(claimData);
        }

        try {
            const response = await fetch(`${SHA_CONFIG.BASE_URL}/claims/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SHA_CONFIG.API_KEY}`,
                    'X-Facility-Code': SHA_CONFIG.FACILITY_CODE
                },
                body: JSON.stringify(claimData)
            });

            const data = await response.json();
            return {
                success: response.ok,
                data: data,
                source: 'SHA_API'
            };
        } catch (error) {
            console.error('SHA Claim Submission Error:', error);
            return {
                success: false,
                error: 'Failed to submit claim to SHA',
                details: error.message
            };
        }
    },

    /**
     * Check claim status
     */
    getClaimStatus: async (externalClaimId) => {
        if (SHA_CONFIG.IS_MOCK) {
            return shaService.mockClaimStatus(externalClaimId);
        }

        try {
            const response = await fetch(`${SHA_CONFIG.BASE_URL}/claims/${externalClaimId}/status`, {
                headers: {
                    'Authorization': `Bearer ${SHA_CONFIG.API_KEY}`,
                    'X-Facility-Code': SHA_CONFIG.FACILITY_CODE
                }
            });

            const data = await response.json();
            return {
                success: response.ok,
                data: data,
                source: 'SHA_API'
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to check claim status'
            };
        }
    },

    /**
     * Request pre-authorization
     */
    requestPreAuth: async (preAuthData) => {
        if (SHA_CONFIG.IS_MOCK) {
            return shaService.mockPreAuthRequest(preAuthData);
        }

        try {
            const response = await fetch(`${SHA_CONFIG.BASE_URL}/preauth/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SHA_CONFIG.API_KEY}`,
                    'X-Facility-Code': SHA_CONFIG.FACILITY_CODE
                },
                body: JSON.stringify(preAuthData)
            });

            const data = await response.json();
            return {
                success: response.ok,
                data: data,
                source: 'SHA_API'
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to request pre-authorization'
            };
        }
    },

    // ==================== MOCK RESPONSES ====================

    mockEligibilityResponse: (nationalId, memberNumber) => {
        // Simulate API delay
        const isEligible = nationalId && nationalId.length >= 7;

        if (isEligible) {
            return {
                success: true,
                data: {
                    eligible: true,
                    member: {
                        national_id: nationalId,
                        sha_id: `SHA-${nationalId.substring(0, 8)}`,
                        member_number: memberNumber || `SHIF-${Date.now()}`,
                        full_name: 'Member Name (Mock)',
                        date_of_birth: '1990-01-01',
                        gender: 'Male',
                        relationship: 'self'
                    },
                    coverage: {
                        scheme: 'SHIF',
                        scheme_name: 'Social Health Insurance Fund',
                        is_active: true,
                        effective_date: '2024-10-01',
                        expiry_date: '2025-09-30',
                        outpatient_limit: 50000,
                        inpatient_limit: 500000,
                        outpatient_balance: 45000,
                        inpatient_balance: 500000,
                        copay_percentage: 0
                    },
                    facility_contracted: true
                },
                source: 'MOCK'
            };
        } else {
            return {
                success: true,
                data: {
                    eligible: false,
                    reason: 'Member not found or inactive',
                    error_code: 'MEMBER_NOT_FOUND'
                },
                source: 'MOCK'
            };
        }
    },

    mockClaimSubmission: (claimData) => {
        const claimId = `SHA-CLM-${Date.now()}`;
        return {
            success: true,
            data: {
                claim_id: claimId,
                status: 'submitted',
                submitted_at: new Date().toISOString(),
                estimated_processing_days: 14,
                message: 'Claim submitted successfully (Mock)'
            },
            source: 'MOCK'
        };
    },

    mockClaimStatus: (externalClaimId) => {
        const statuses = ['processing', 'approved', 'paid'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        return {
            success: true,
            data: {
                claim_id: externalClaimId,
                status: randomStatus,
                approved_amount: randomStatus !== 'processing' ? 15000 : null,
                payment_date: randomStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
                last_updated: new Date().toISOString()
            },
            source: 'MOCK'
        };
    },

    mockPreAuthRequest: (preAuthData) => {
        const preAuthId = `SHA-PA-${Date.now()}`;
        return {
            success: true,
            data: {
                preauth_id: preAuthId,
                status: 'submitted',
                estimated_response_hours: 24,
                message: 'Pre-authorization request submitted (Mock)'
            },
            source: 'MOCK'
        };
    }
};

module.exports = shaService;
