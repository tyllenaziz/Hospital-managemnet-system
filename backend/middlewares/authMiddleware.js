const jwt = require("jsonwebtoken");

/**
 * ================================
 * AUTHENTICATION CONFIGURATION
 * ================================
 * Fail-fast secret validation (CRITICAL)
 *
 * If JWT secrets are missing, jsonwebtoken will still
 * sign/verify tokens using `undefined`, making tokens forgeable.
 * This would result in a full authentication bypass.
 */
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets are not defined in environment variables");
}

/**
 * ================================
 * AUTH MIDDLEWARE
 * ================================
 * Security notes:
 * - Enforces JWT verification server-side
 * - Explicitly restricts algorithm to HS256
 * - Uses a minimal trust model for token payload
 * - Avoids leaking authentication state in error responses
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  /**
   * Header validation (HARDENING)
   * Prevents:
   * - Malformed headers
   * - Missing Bearer scheme
   * - Header smuggling edge cases
   */
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Authentication failed"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    /**
     * JWT verification with explicit algorithm restriction (HIGH)
     * Prevents acceptance of tokens signed with weaker or unexpected algorithms
     */
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"]
    });

    /**
     * Minimal trust model (IDOR / privilege hardening)
     *
     * Do NOT trust the full decoded payload.
     * User may have been:
     * - Deleted
     * - Disabled
     * - Had role changed
     *
     * For sensitive routes (especially admin):
     * - Re-fetch user from DB
     * - Verify isActive === true
     * - Re-check role/permissions
     */
    req.user = {
      id: decoded.id,
      role: decoded.role,
      hospital_id: decoded.hospital_id,
      branch_id: decoded.branch_id
    };

    next();
  } catch (err) {
    /**
     * Token expiration is explicitly handled
     * Enables frontend refresh-token logic (good UX)
     *
     * External error message is intentionally generic
     * to reduce auth-state leakage.
     */
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Authentication failed",
        tokenExpired: true
      });
    }

    // Internal logging recommended (not shown here)
    return res.status(401).json({
      success: false,
      error: "Authentication failed"
    });
  }
};

/**
 * ================================
 * TOKEN GENERATION
 * ================================
 */

/**
 * Generate short-lived access token
 * - Explicit algorithm
 * - Limited blast radius if compromised
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      hospital_id: user.hospital_id,
      branch_id: user.branch_id
    },
    JWT_SECRET,
    {
      expiresIn: "2h",
      algorithm: "HS256"
    }
  );
};

/**
 * Generate refresh token (STATELESS)
 *
 * Security Risk (HIGH):
 * - No rotation
 * - No storage
 * - No revocation
 *
 * Acceptable for MVP, risky for production.
 *
 * Hardening options:
 * I. Rotate refresh tokens on every use
 * II. Store hashed refresh tokens in DB
 * III. Revoke on logout / password change
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
      algorithm: "HS256"
    }
  );
};

/**
 * Verify refresh token
 * Uses explicit algorithm restriction
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ["HS256"]
    });
  } catch (err) {
    return null;
  }
};

/**
 * ================================
 * ROLE-BASED MIDDLEWARE
 * ================================
 */

/**
 * Require Super Admin role
 * Used for platform-level management routes
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Super Admin privileges required.'
    });
  }
  next();
};

/**
 * Require Admin or higher role
 * Used for hospital-level management routes
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || !['superadmin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  verifyToken: authMiddleware, // Alias for consistency
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  requireSuperAdmin,
  requireAdmin
};
