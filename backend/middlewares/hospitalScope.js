/**
 * Hospital Scope Middleware
 * 
 * Enforces multi-tenant data isolation by ensuring every request
 * has a valid hospital_id from the authenticated user's JWT token.
 * 
 * Usage in routes:
 *   router.get('/patients', authMiddleware, requireHospitalScope, controller.getAll);
 */

/**
 * Middleware that requires hospital_id on the request.
 * Must be used AFTER authMiddleware (which sets req.user).
 * 
 * - Superadmin users can optionally pass hospital_id as query param
 * - All other users must have hospital_id in their JWT token
 * - Sets req.hospitalId for convenient access in controllers
 */
const requireHospitalScope = (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Superadmin can operate across hospitals
    if (req.user.role === 'superadmin') {
      // Superadmin can specify hospital_id via query param or body
      req.hospitalId = req.query.hospital_id || req.body.hospital_id || req.user.hospital_id || null;
      return next();
    }

    // All other roles must have hospital_id
    const hospitalId = req.user.hospital_id;

    if (!hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'Hospital context required. Your account is not associated with a hospital.'
      });
    }

    // Set convenient accessor
    req.hospitalId = hospitalId;
    next();

  } catch (error) {
    console.error('Hospital scope middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error in hospital scope validation'
    });
  }
};

/**
 * Optional hospital scope — sets req.hospitalId if available but doesn't reject.
 * Useful for endpoints that work with or without hospital context (e.g., superadmin dashboards).
 */
const optionalHospitalScope = (req, res, next) => {
  if (req.user) {
    req.hospitalId = req.user.hospital_id || req.query.hospital_id || null;
  }
  next();
};

module.exports = { requireHospitalScope, optionalHospitalScope };
