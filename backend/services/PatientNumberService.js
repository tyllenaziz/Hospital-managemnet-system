/**
 * Patient Number Generator Service
 * Generates patient numbers based on hospital-specific settings
 */
const { DataTypes, Op } = require('sequelize');

class PatientNumberService {
    constructor(sequelize) {
        this.sequelize = sequelize;
    }

    /**
     * Get patient number settings for a hospital
     * @param {number} hospitalId 
     * @returns {Object} Settings object
     */
    async getSettings(hospitalId) {
        const [results] = await this.sequelize.query(`
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE hospital_id = :hospitalId
      AND setting_key IN (
        'patient_number_prefix',
        'patient_number_format',
        'patient_number_padding',
        'patient_number_start',
        'patient_number_next',
        'patient_number_include_year'
      )
    `, {
            replacements: { hospitalId },
            type: this.sequelize.QueryTypes.SELECT
        });

        const settings = {};
        results.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        return {
            prefix: settings.patient_number_prefix || 'PAT',
            format: settings.patient_number_format || 'PREFIX-SEQUENCE',
            padding: parseInt(settings.patient_number_padding) || 5,
            start: parseInt(settings.patient_number_start) || 1,
            next: parseInt(settings.patient_number_next) || 1,
            includeYear: settings.patient_number_include_year === 'true'
        };
    }

    /**
     * Update settings for a hospital
     * @param {number} hospitalId 
     * @param {Object} newSettings 
     */
    async updateSettings(hospitalId, newSettings) {
        const settingsMap = {
            prefix: 'patient_number_prefix',
            format: 'patient_number_format',
            padding: 'patient_number_padding',
            start: 'patient_number_start',
            next: 'patient_number_next',
            includeYear: 'patient_number_include_year'
        };

        for (const [key, value] of Object.entries(newSettings)) {
            const settingKey = settingsMap[key];
            if (settingKey) {
                await this.sequelize.query(`
          INSERT INTO system_settings (hospital_id, setting_key, setting_value, description)
          VALUES (:hospitalId, :settingKey, :value, :description)
          ON DUPLICATE KEY UPDATE setting_value = :value
        `, {
                    replacements: {
                        hospitalId,
                        settingKey,
                        value: String(value),
                        description: `Patient number ${key} setting`
                    }
                });
            }
        }
    }

    /**
     * Generate next patient number for a hospital
     * Uses transaction to prevent duplicates
     * @param {number} hospitalId 
     * @returns {string} Generated patient number
     */
    async generateNextPatientNumber(hospitalId) {
        const transaction = await this.sequelize.transaction();

        try {
            // Lock and get current next number
            const [settings] = await this.sequelize.query(`
        SELECT setting_value 
        FROM system_settings 
        WHERE hospital_id = :hospitalId 
        AND setting_key = 'patient_number_next'
        FOR UPDATE
      `, {
                replacements: { hospitalId },
                type: this.sequelize.QueryTypes.SELECT,
                transaction
            });

            // Get other settings
            const fullSettings = await this.getSettings(hospitalId);
            const nextNum = settings ? parseInt(settings.setting_value) : fullSettings.start;

            // Generate the number based on format
            const patientNumber = this.formatPatientNumber(nextNum, fullSettings);

            // Increment the next number
            await this.sequelize.query(`
        UPDATE system_settings 
        SET setting_value = :nextValue
        WHERE hospital_id = :hospitalId 
        AND setting_key = 'patient_number_next'
      `, {
                replacements: {
                    hospitalId,
                    nextValue: String(nextNum + 1)
                },
                transaction
            });

            await transaction.commit();
            return patientNumber;

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Format a patient number based on settings
     * @param {number} sequence 
     * @param {Object} settings 
     * @returns {string} Formatted patient number
     */
    formatPatientNumber(sequence, settings) {
        const paddedSequence = String(sequence).padStart(settings.padding, '0');
        const year = new Date().getFullYear();

        switch (settings.format) {
            case 'PREFIX-SEQUENCE':
                return `${settings.prefix}-${paddedSequence}`;

            case 'YEAR-SEQUENCE':
                return `${year}-${paddedSequence}`;

            case 'PREFIX-YEAR-SEQUENCE':
                return `${settings.prefix}-${year}-${paddedSequence}`;

            case 'YEAR-PREFIX-SEQUENCE':
                return `${year}-${settings.prefix}-${paddedSequence}`;

            case 'SEQUENCE':
                return paddedSequence;

            case 'PREFIX/YEAR/SEQUENCE':
                return `${settings.prefix}/${year}/${paddedSequence}`;

            default:
                if (settings.includeYear) {
                    return `${settings.prefix}-${year}-${paddedSequence}`;
                }
                return `${settings.prefix}-${paddedSequence}`;
        }
    }

    /**
     * Validate a patient number format
     * @param {string} patientNumber 
     * @param {number} hospitalId 
     * @returns {boolean} Is valid
     */
    async validatePatientNumber(patientNumber, hospitalId) {
        if (!patientNumber || patientNumber.trim() === '') {
            return false;
        }

        // Check if already exists in this hospital
        const [existing] = await this.sequelize.query(`
      SELECT id FROM patients 
      WHERE hospital_id = :hospitalId 
      AND patient_number = :patientNumber
    `, {
            replacements: { hospitalId, patientNumber },
            type: this.sequelize.QueryTypes.SELECT
        });

        return !existing;
    }

    /**
     * Get preview of patient number format
     * @param {Object} settings 
     * @returns {string} Example patient number
     */
    getFormatPreview(settings) {
        return this.formatPatientNumber(1, settings);
    }

    /**
     * Get available format options
     * @returns {Array} Format options
     */
    getFormatOptions() {
        return [
            { value: 'PREFIX-SEQUENCE', label: 'Prefix-Number', example: 'PAT-00001' },
            { value: 'YEAR-SEQUENCE', label: 'Year-Number', example: '2026-00001' },
            { value: 'PREFIX-YEAR-SEQUENCE', label: 'Prefix-Year-Number', example: 'PAT-2026-00001' },
            { value: 'YEAR-PREFIX-SEQUENCE', label: 'Year-Prefix-Number', example: '2026-PAT-00001' },
            { value: 'SEQUENCE', label: 'Number Only', example: '00001' },
            { value: 'PREFIX/YEAR/SEQUENCE', label: 'Prefix/Year/Number', example: 'PAT/2026/00001' }
        ];
    }

    /**
     * Reset patient number sequence (admin only)
     * @param {number} hospitalId 
     * @param {number} startFrom 
     */
    async resetSequence(hospitalId, startFrom = 1) {
        await this.updateSettings(hospitalId, {
            next: startFrom
        });
    }

    /**
     * Initialize settings for a new hospital
     * @param {number} hospitalId 
     * @param {string} prefix - Optional custom prefix
     */
    async initializeForHospital(hospitalId, prefix = null) {
        // Get hospital code for default prefix
        let defaultPrefix = 'PAT';
        if (!prefix) {
            const [hospital] = await this.sequelize.query(`
        SELECT code FROM hospitals WHERE id = :hospitalId
      `, {
                replacements: { hospitalId },
                type: this.sequelize.QueryTypes.SELECT
            });
            if (hospital) {
                defaultPrefix = hospital.code.substring(0, 3).toUpperCase();
            }
        }

        const defaultSettings = {
            prefix: prefix || defaultPrefix,
            format: 'PREFIX-SEQUENCE',
            padding: 5,
            start: 1,
            next: 1,
            includeYear: false
        };

        await this.updateSettings(hospitalId, defaultSettings);
        return defaultSettings;
    }
}

module.exports = PatientNumberService;
