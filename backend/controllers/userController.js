const db = require("../config/dbconfig");
const bcrypt = require("bcryptjs");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../middlewares/authMiddleware");
const auditLogger = require("../utils/auditLogger");
const {
  findHospitalByIdentifier,
  slugifyHospitalName,
} = require("../utils/hospitalTenant");

const userController = {
  register: async (req, res) => {
    try {
      const { username, password, role, phone, hospital_id, branch_id } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({
          success: false,
          error: "Username, password, and role are required"
        });
      }

      // Determine the hospital_id for the new user
      // SuperAdmin can specify hospital_id, others use their own hospital
      let userHospitalId = hospital_id;
      let userBranchId = branch_id;

      if (req.user?.role !== 'superadmin') {
        // Non-superadmins can only create users for their own hospital
        userHospitalId = req.user?.hospital_id;
        userBranchId = branch_id || req.user?.branch_id;

        if (!userHospitalId) {
          return res.status(400).json({
            success: false,
            error: "Cannot create user without hospital association"
          });
        }
      }

      // Prevent creating superadmin users (only platform-level can do this)
      if (role === 'superadmin' && req.user?.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: "Cannot create superadmin users"
        });
      }

      // Check if username exists
      const checkQuery = 'SELECT id FROM users WHERE username = ?';
      const [existingUsers] = await db.query(checkQuery, [username]);

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Username already exists"
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user with hospital and branch
      const insertQuery = `
        INSERT INTO users (username, password, role, phone, hospital_id, branch_id) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(insertQuery, [
        username, hashedPassword, role, phone || null,
        userHospitalId || null, userBranchId || null
      ]);

      // Log user registration to audit trail
      await auditLogger.logCreate(req, 'user', result.insertId,
        `New staff member created: ${username} (${role})`,
        { username, role, phone: phone || '', hospital_id: userHospitalId }
      );

      res.json({
        success: true,
        message: "Staff member added successfully",
        user: {
          id: result.insertId,
          username,
          role,
          phone: phone || '',
          hospital_id: userHospitalId,
          branch_id: userBranchId
        }
      });

    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password, hospital_code } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Username and password are required"
        });
      }

      const requestedHospitalIdentifier =
        typeof hospital_code === "string" ? hospital_code.trim() : "";
      let requestedHospital = null;

      if (requestedHospitalIdentifier) {
        const hospital = await findHospitalByIdentifier(db, requestedHospitalIdentifier, {
          includeInactive: true,
          fields: "id, code, name, is_active",
        });

        if (!hospital || !hospital.is_active) {
          return res.status(404).json({
            success: false,
            error: "Hospital login context is invalid or inactive"
          });
        }

        requestedHospital = hospital;
      }

      // Find user
      const query = 'SELECT * FROM users WHERE username = ?';
      const [results] = await db.query(query, [username]);

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials"
        });
      }

      const user = results[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials"
        });
      }

      if (requestedHospital) {
        if (user.role === "superadmin") {
          return res.status(403).json({
            success: false,
            error: "Superadmin accounts must sign in from the central portal"
          });
        }

        if (!user.hospital_id || user.hospital_id !== requestedHospital.id) {
          return res.status(403).json({
            success: false,
            error: "This account does not belong to the requested hospital"
          });
        }
      }

      // Update last login
      const updateQuery = 'UPDATE users SET lastLogin = NOW() WHERE id = ?';
      await db.query(updateQuery, [user.id]);

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store refresh token
      const storeTokenQuery = 'UPDATE users SET refresh_token = ? WHERE id = ?';
      await db.query(storeTokenQuery, [refreshToken, user.id]);

      // Log successful login to audit trail
      // Log successful login to audit trail
      await auditLogger.logLogin(req, user.id, user.username);

      // Fetch full hospital branding for receipts and UI
      let hospitalData = {};
      let enabledModules = [];
      if (user.hospital_id) {
        const [h] = await db.query(
          `SELECT name, code, logo_path, address, city, county, country,
                  phone, alternative_phone, email, website, license_number, tax_pin
           FROM hospitals WHERE id = ?`,
          [user.hospital_id]
        );
        if (h.length > 0) {
          hospitalData = {
            hospital_name: h[0].name,
            hospital_code: h[0].code,
            hospital_slug:
              requestedHospital?.tenant_slug || slugifyHospitalName(h[0].name),
            hospital_logo: h[0].logo_path,
            hospital_address: h[0].address,
            hospital_city: h[0].city,
            hospital_county: h[0].county,
            hospital_country: h[0].country || 'Kenya',
            hospital_phone: h[0].phone,
            hospital_alt_phone: h[0].alternative_phone,
            hospital_email: h[0].email,
            hospital_website: h[0].website,
            hospital_license: h[0].license_number,
            hospital_tax_pin: h[0].tax_pin
          };
        }

        // Fetch enabled modules for this hospital
        try {
          const HospitalModule = require('../models/HospitalModule');
          enabledModules = await HospitalModule.getEnabledModuleCodes(user.hospital_id);
        } catch (err) {
          console.error('Error fetching hospital modules:', err);
          enabledModules = [];
        }
      }

      res.json({
        success: true,
        message: "Login successful",
        token: accessToken,
        refreshToken: refreshToken,
        modules: enabledModules,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          phone: user.phone,
          hospital_id: user.hospital_id,
          ...hospitalData
        }
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Login failed"
      });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: "Refresh token required"
        });
      }

      const decoded = verifyRefreshToken(refreshToken);

      if (!decoded) {
        return res.status(403).json({
          success: false,
          error: "Invalid refresh token"
        });
      }

      // Verify refresh token exists in database
      const query = 'SELECT * FROM users WHERE id = ? AND refresh_token = ?';
      const [results] = await db.query(query, [decoded.id, refreshToken]);

      if (results.length === 0) {
        return res.status(403).json({
          success: false,
          error: "Invalid refresh token"
        });
      }

      const user = results[0];
      const newAccessToken = generateAccessToken(user);

      res.json({
        success: true,
        token: newAccessToken
      });

    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to refresh token"
      });
    }
  },

  logout: async (req, res) => {
    try {
      const userId = req.user?.id;

      if (userId) {
        // Log logout to audit trail before clearing token
        await auditLogger.logLogout(req, userId, req.user?.username || 'Unknown');

        // Clear refresh token from database
        const query = 'UPDATE users SET refresh_token = NULL WHERE id = ?';
        await db.query(query, [userId]);
      }

      res.json({
        success: true,
        message: "Logged out successfully"
      });

    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        error: "Logout failed"
      });
    }
  },

  listUsers: async (req, res) => {
    try {
      const hospitalId = req.user?.hospital_id;

      // SuperAdmin can see all users, but hospital admins only see their hospital's users
      let query, params;

      if (req.user?.role === 'superadmin') {
        // SuperAdmin sees all users except other superadmins
        query = `
          SELECT u.id, u.username, u.role, u.phone, u.createdAt, u.hospital_id, u.branch_id,
                 h.name as hospital_name, b.name as branch_name
          FROM users u
          LEFT JOIN hospitals h ON u.hospital_id = h.id
          LEFT JOIN branches b ON u.branch_id = b.id
          WHERE u.role != 'superadmin'
          ORDER BY h.name, u.createdAt DESC
        `;
        params = [];
      } else if (hospitalId) {
        // Hospital users only see users from their own hospital (excluding superadmins)
        query = `
          SELECT u.id, u.username, u.role, u.phone, u.createdAt, u.hospital_id, u.branch_id,
                 b.name as branch_name
          FROM users u
          LEFT JOIN branches b ON u.branch_id = b.id
          WHERE u.hospital_id = ? AND u.role != 'superadmin'
          ORDER BY u.createdAt DESC
        `;
        params = [hospitalId];
      } else {
        // No hospital_id and not superadmin - return empty
        return res.json([]);
      }

      const [results] = await db.query(query, params);
      res.json(results);

    } catch (error) {
      console.error("List users error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch users"
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, role, phone } = req.body;

      let updateFields = [];
      let values = [];

      if (username) {
        updateFields.push('username = ?');
        values.push(username);
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password = ?');
        values.push(hashedPassword);
      }

      if (role) {
        updateFields.push('role = ?');
        values.push(role);
      }

      if (phone !== undefined) {
        updateFields.push('phone = ?');
        values.push(phone || null);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No fields to update"
        });
      }

      values.push(id);

      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      const [result] = await db.query(query, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      res.json({
        success: true,
        message: "User updated successfully"
      });

    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      const query = 'DELETE FROM users WHERE id = ?';
      const [result] = await db.query(query, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      res.json({
        success: true,
        message: "User deleted successfully"
      });

    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
};

module.exports = userController;
