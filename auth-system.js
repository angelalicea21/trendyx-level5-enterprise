/**
 * TrendyX AI Level 5 Enterprise - Advanced Authentication System
 * Secure JWT-based authentication with enterprise-grade security
 * Compatible with existing TrendyX AI infrastructure
 * Version: 1.0.0
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class AuthenticationSystem {
  constructor(options = {}) {
    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET || this.generateSecretKey();
    this.jwtExpiry = options.jwtExpiry || '24h';
    this.saltRounds = options.saltRounds || 12;
    this.maxLoginAttempts = options.maxLoginAttempts || 5;
    this.lockoutDuration = options.lockoutDuration || 15 * 60 * 1000; // 15 minutes
    
    // In-memory storage for demo (replace with database in production)
    this.users = new Map();
    this.sessions = new Map();
    this.loginAttempts = new Map();
    this.refreshTokens = new Map();
    
    console.log('🔐 TrendyX AI Authentication System initialized');
  }

  /**
   * Generate a secure secret key for JWT signing
   */
  generateSecretKey() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload, expiresIn = this.jwtExpiry) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    const refreshToken = uuidv4();
    this.refreshTokens.set(refreshToken, {
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    return refreshToken;
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      valid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  }

  /**
   * Check if user is locked out due to failed login attempts
   */
  isUserLockedOut(email) {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;

    if (attempts.count >= this.maxLoginAttempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      return timeSinceLastAttempt < this.lockoutDuration;
    }
    return false;
  }

  /**
   * Record failed login attempt
   */
  recordFailedLogin(email) {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(email, attempts);
  }

  /**
   * Clear failed login attempts
   */
  clearFailedLogins(email) {
    this.loginAttempts.delete(email);
  }

  /**
   * Register new user
   */
  async registerUser(userData) {
    const { email, password, firstName, lastName, company, role = 'user' } = userData;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      throw new Error('Missing required fields');
    }

    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error('Password does not meet security requirements');
    }

    if (this.users.has(email)) {
      throw new Error('User already exists');
    }

    // Create user
    const userId = uuidv4();
    const hashedPassword = await this.hashPassword(password);
    
    const user = {
      id: userId,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      company: company || '',
      role,
      createdAt: new Date(),
      lastLogin: null,
      isActive: true,
      emailVerified: false,
      profile: {
        avatar: null,
        bio: '',
        preferences: {
          theme: 'dark',
          notifications: true,
          aiAssistance: true
        }
      },
      usage: {
        quantumOperations: 0,
        neuralInferences: 0,
        predictiveAnalyses: 0,
        totalSessions: 0
      }
    };

    this.users.set(email, user);

    // Generate tokens
    const accessToken = this.generateToken({ 
      userId, 
      email, 
      role,
      firstName,
      lastName 
    });
    const refreshToken = this.generateRefreshToken(userId);

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        company,
        role,
        createdAt: user.createdAt
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  /**
   * Login user
   */
  async loginUser(email, password) {
    // Check if user is locked out
    if (this.isUserLockedOut(email)) {
      throw new Error('Account temporarily locked due to multiple failed login attempts');
    }

    // Find user
    const user = this.users.get(email);
    if (!user) {
      this.recordFailedLogin(email);
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      this.recordFailedLogin(email);
      throw new Error('Invalid credentials');
    }

    // Clear failed login attempts
    this.clearFailedLogins(email);

    // Update last login
    user.lastLogin = new Date();
    user.usage.totalSessions++;

    // Generate tokens
    const accessToken = this.generateToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName 
    });
    const refreshToken = this.generateRefreshToken(user.id);

    // Create session
    const sessionId = uuidv4();
    this.sessions.set(sessionId, {
      userId: user.id,
      email: user.email,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: null, // Set by middleware
      userAgent: null  // Set by middleware
    });

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        role: user.role,
        lastLogin: user.lastLogin,
        profile: user.profile,
        usage: user.usage
      },
      tokens: {
        accessToken,
        refreshToken
      },
      sessionId
    };
  }

  /**
   * Refresh access token
   */
  refreshAccessToken(refreshToken) {
    const tokenData = this.refreshTokens.get(refreshToken);
    if (!tokenData) {
      throw new Error('Invalid refresh token');
    }

    if (new Date() > tokenData.expiresAt) {
      this.refreshTokens.delete(refreshToken);
      throw new Error('Refresh token expired');
    }

    // Find user
    const user = Array.from(this.users.values()).find(u => u.id === tokenData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = this.generateToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName 
    });

    return {
      success: true,
      accessToken
    };
  }

  /**
   * Logout user
   */
  logoutUser(sessionId, refreshToken) {
    // Remove session
    if (sessionId) {
      this.sessions.delete(sessionId);
    }

    // Remove refresh token
    if (refreshToken) {
      this.refreshTokens.delete(refreshToken);
    }

    return {
      success: true,
      message: 'Logout successful'
    };
  }

  /**
   * Get user profile
   */
  getUserProfile(userId) {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      profile: user.profile,
      usage: user.usage
    };
  }

  /**
   * Update user profile
   */
  updateUserProfile(userId, updates) {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'company'];
    const allowedProfileFields = ['avatar', 'bio', 'preferences'];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    if (updates.profile) {
      allowedProfileFields.forEach(field => {
        if (updates.profile[field] !== undefined) {
          user.profile[field] = { ...user.profile[field], ...updates.profile[field] };
        }
      });
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      user: this.getUserProfile(userId)
    };
  }

  /**
   * Middleware for protecting routes
   */
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    try {
      const decoded = this.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
  }

  /**
   * Middleware for role-based access control
   */
  requireRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }

      next();
    };
  }

  /**
   * Get authentication statistics
   */
  getAuthStats() {
    const totalUsers = this.users.size;
    const activeSessions = this.sessions.size;
    const activeRefreshTokens = this.refreshTokens.size;
    const lockedAccounts = Array.from(this.loginAttempts.values())
      .filter(attempt => attempt.count >= this.maxLoginAttempts).length;

    return {
      totalUsers,
      activeSessions,
      activeRefreshTokens,
      lockedAccounts,
      timestamp: new Date()
    };
  }
}

module.exports = AuthenticationSystem;

