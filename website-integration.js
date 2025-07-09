/**
 * TrendyX AI Level 5 Enterprise - Website Integration API Bridge
 * Seamless integration between main website and TrendyX AI platform
 * Handles cross-domain authentication and user synchronization
 * Version: 1.0.0
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class WebsiteIntegration {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.WEBSITE_API_KEY || this.generateApiKey();
    this.allowedOrigins = options.allowedOrigins || [
      'https://your-main-website.com',
      'https://www.your-main-website.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    this.webhookSecret = options.webhookSecret || process.env.WEBHOOK_SECRET || this.generateWebhookSecret();
    this.integrationTokens = new Map(); // Temporary tokens for cross-domain auth
    this.pendingSignups = new Map(); // Pending signup requests from main website
    
    console.log('🌐 TrendyX AI Website Integration initialized');
  }

  /**
   * Generate API key for website integration
   */
  generateApiKey() {
    return 'trendyx_' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate webhook secret
   */
  generateWebhookSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Verify API key
   */
  verifyApiKey(providedKey) {
    return providedKey === this.apiKey;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Check if origin is allowed
   */
  isOriginAllowed(origin) {
    return this.allowedOrigins.includes(origin) || 
           this.allowedOrigins.includes('*') ||
           (process.env.NODE_ENV === 'development' && origin?.includes('localhost'));
  }

  /**
   * Generate integration token for cross-domain authentication
   */
  generateIntegrationToken(userData) {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    this.integrationTokens.set(token, {
      userData,
      createdAt: new Date(),
      expiresAt,
      used: false
    });

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return {
      token,
      expiresAt,
      redirectUrl: `${process.env.TRENDYX_URL || 'http://localhost:3000'}/auth/integrate?token=${token}`
    };
  }

  /**
   * Verify and consume integration token
   */
  verifyIntegrationToken(token) {
    const tokenData = this.integrationTokens.get(token);
    
    if (!tokenData) {
      throw new Error('Invalid integration token');
    }

    if (new Date() > tokenData.expiresAt) {
      this.integrationTokens.delete(token);
      throw new Error('Integration token expired');
    }

    if (tokenData.used) {
      throw new Error('Integration token already used');
    }

    // Mark as used
    tokenData.used = true;
    this.integrationTokens.set(token, tokenData);

    return tokenData.userData;
  }

  /**
   * Clean up expired integration tokens
   */
  cleanupExpiredTokens() {
    const now = new Date();
    for (const [token, data] of this.integrationTokens.entries()) {
      if (now > data.expiresAt || data.used) {
        this.integrationTokens.delete(token);
      }
    }
  }

  /**
   * Handle signup request from main website
   */
  async handleWebsiteSignup(signupData, origin) {
    try {
      // Verify origin
      if (!this.isOriginAllowed(origin)) {
        throw new Error('Origin not allowed');
      }

      // Validate signup data
      const { email, firstName, lastName, company, plan, referralCode } = signupData;
      
      if (!email || !firstName || !lastName) {
        throw new Error('Missing required fields');
      }

      // Create pending signup
      const signupId = uuidv4();
      const pendingSignup = {
        id: signupId,
        email,
        firstName,
        lastName,
        company: company || '',
        plan: plan || 'free',
        referralCode: referralCode || null,
        origin,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        status: 'pending'
      };

      this.pendingSignups.set(signupId, pendingSignup);

      // Generate integration token
      const integrationToken = this.generateIntegrationToken({
        signupId,
        email,
        firstName,
        lastName,
        company,
        plan,
        referralCode,
        source: 'website_signup'
      });

      return {
        success: true,
        signupId,
        integrationToken: integrationToken.token,
        redirectUrl: integrationToken.redirectUrl,
        expiresAt: integrationToken.expiresAt
      };
    } catch (error) {
      console.error('Website signup error:', error);
      throw error;
    }
  }

  /**
   * Complete signup from integration token
   */
  async completeSignupFromToken(token, authSystem, userDatabase) {
    try {
      const userData = this.verifyIntegrationToken(token);
      
      if (userData.source !== 'website_signup') {
        throw new Error('Invalid token source');
      }

      const pendingSignup = this.pendingSignups.get(userData.signupId);
      if (!pendingSignup) {
        throw new Error('Signup request not found');
      }

      if (new Date() > pendingSignup.expiresAt) {
        this.pendingSignups.delete(userData.signupId);
        throw new Error('Signup request expired');
      }

      // Generate temporary password (user will be prompted to set their own)
      const tempPassword = this.generateTempPassword();

      // Register user through auth system
      const registrationResult = await authSystem.registerUser({
        email: pendingSignup.email,
        password: tempPassword,
        firstName: pendingSignup.firstName,
        lastName: pendingSignup.lastName,
        company: pendingSignup.company,
        role: 'user'
      });

      if (!registrationResult.success) {
        throw new Error('Registration failed');
      }

      // Update user profile with plan information
      await userDatabase.updateUserProfile(registrationResult.user.id, {
        settings: {
          plan: pendingSignup.plan,
          referralCode: pendingSignup.referralCode,
          signupSource: 'website',
          requiresPasswordSetup: true
        }
      });

      // Mark signup as completed
      pendingSignup.status = 'completed';
      pendingSignup.completedAt = new Date();
      pendingSignup.userId = registrationResult.user.id;
      this.pendingSignups.set(userData.signupId, pendingSignup);

      return {
        success: true,
        user: registrationResult.user,
        tokens: registrationResult.tokens,
        requiresPasswordSetup: true,
        tempPassword
      };
    } catch (error) {
      console.error('Signup completion error:', error);
      throw error;
    }
  }

  /**
   * Generate temporary password
   */
  generateTempPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Handle login request from main website
   */
  async handleWebsiteLogin(loginData, origin) {
    try {
      // Verify origin
      if (!this.isOriginAllowed(origin)) {
        throw new Error('Origin not allowed');
      }

      const { email, redirectUrl } = loginData;
      
      if (!email) {
        throw new Error('Email required');
      }

      // Generate integration token for login
      const integrationToken = this.generateIntegrationToken({
        email,
        redirectUrl: redirectUrl || '/',
        source: 'website_login'
      });

      return {
        success: true,
        integrationToken: integrationToken.token,
        redirectUrl: integrationToken.redirectUrl,
        expiresAt: integrationToken.expiresAt
      };
    } catch (error) {
      console.error('Website login error:', error);
      throw error;
    }
  }

  /**
   * Complete login from integration token
   */
  async completeLoginFromToken(token, email, password, authSystem) {
    try {
      const userData = this.verifyIntegrationToken(token);
      
      if (userData.source !== 'website_login') {
        throw new Error('Invalid token source');
      }

      if (userData.email !== email) {
        throw new Error('Email mismatch');
      }

      // Authenticate user
      const loginResult = await authSystem.loginUser(email, password);

      return {
        success: true,
        user: loginResult.user,
        tokens: loginResult.tokens,
        sessionId: loginResult.sessionId,
        redirectUrl: userData.redirectUrl || '/'
      };
    } catch (error) {
      console.error('Login completion error:', error);
      throw error;
    }
  }

  /**
   * Sync user data with main website
   */
  async syncUserWithWebsite(userId, userData, webhookUrl) {
    try {
      if (!webhookUrl) {
        console.log('No webhook URL configured, skipping sync');
        return { success: true, skipped: true };
      }

      const payload = {
        event: 'user_updated',
        userId,
        userData: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          company: userData.company,
          lastLogin: userData.lastLogin,
          usage: userData.usage
        },
        timestamp: new Date().toISOString()
      };

      const payloadString = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payloadString)
        .digest('hex');

      // In a real implementation, you would make an HTTP request to the webhook URL
      console.log('🔄 Syncing user data with main website:', {
        webhookUrl,
        userId,
        signature: signature.substring(0, 8) + '...'
      });

      return {
        success: true,
        synced: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('User sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle webhook from main website
   */
  async handleWebhook(payload, signature, authSystem, userDatabase) {
    try {
      // Verify signature
      if (!this.verifyWebhookSignature(JSON.stringify(payload), signature)) {
        throw new Error('Invalid webhook signature');
      }

      const { event, data } = payload;

      switch (event) {
        case 'user_created':
          return await this.handleUserCreatedWebhook(data, authSystem, userDatabase);
        
        case 'user_updated':
          return await this.handleUserUpdatedWebhook(data, authSystem, userDatabase);
        
        case 'user_deleted':
          return await this.handleUserDeletedWebhook(data, authSystem, userDatabase);
        
        case 'subscription_updated':
          return await this.handleSubscriptionUpdatedWebhook(data, userDatabase);
        
        default:
          console.log('Unknown webhook event:', event);
          return { success: true, message: 'Event ignored' };
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Handle user created webhook
   */
  async handleUserCreatedWebhook(data, authSystem, userDatabase) {
    try {
      const { email, firstName, lastName, company, plan } = data;
      
      // Check if user already exists
      const existingUser = userDatabase.getUserByEmail(email);
      if (existingUser) {
        return { success: true, message: 'User already exists' };
      }

      // Create user with temporary password
      const tempPassword = this.generateTempPassword();
      const registrationResult = await authSystem.registerUser({
        email,
        password: tempPassword,
        firstName,
        lastName,
        company: company || '',
        role: 'user'
      });

      // Update profile with plan information
      await userDatabase.updateUserProfile(registrationResult.user.id, {
        settings: {
          plan: plan || 'free',
          signupSource: 'website_webhook',
          requiresPasswordSetup: true
        }
      });

      return {
        success: true,
        message: 'User created successfully',
        userId: registrationResult.user.id
      };
    } catch (error) {
      console.error('User created webhook error:', error);
      throw error;
    }
  }

  /**
   * Handle user updated webhook
   */
  async handleUserUpdatedWebhook(data, authSystem, userDatabase) {
    try {
      const { email, firstName, lastName, company } = data;
      
      const user = userDatabase.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Update user data
      await userDatabase.updateUser(email, {
        firstName,
        lastName,
        company
      });

      return {
        success: true,
        message: 'User updated successfully'
      };
    } catch (error) {
      console.error('User updated webhook error:', error);
      throw error;
    }
  }

  /**
   * Handle user deleted webhook
   */
  async handleUserDeletedWebhook(data, authSystem, userDatabase) {
    try {
      const { email } = data;
      
      const user = userDatabase.getUserByEmail(email);
      if (!user) {
        return { success: true, message: 'User not found' };
      }

      // Deactivate user instead of deleting
      await userDatabase.updateUser(email, {
        isActive: false
      });

      return {
        success: true,
        message: 'User deactivated successfully'
      };
    } catch (error) {
      console.error('User deleted webhook error:', error);
      throw error;
    }
  }

  /**
   * Handle subscription updated webhook
   */
  async handleSubscriptionUpdatedWebhook(data, userDatabase) {
    try {
      const { email, plan, status } = data;
      
      const user = userDatabase.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Update user profile with subscription info
      await userDatabase.updateUserProfile(user.id, {
        settings: {
          plan,
          subscriptionStatus: status,
          updatedAt: new Date().toISOString()
        }
      });

      return {
        success: true,
        message: 'Subscription updated successfully'
      };
    } catch (error) {
      console.error('Subscription updated webhook error:', error);
      throw error;
    }
  }

  /**
   * Get integration statistics
   */
  getIntegrationStats() {
    const activeTokens = Array.from(this.integrationTokens.values())
      .filter(token => !token.used && new Date() < token.expiresAt).length;
    
    const pendingSignupsCount = Array.from(this.pendingSignups.values())
      .filter(signup => signup.status === 'pending' && new Date() < signup.expiresAt).length;

    return {
      activeIntegrationTokens: activeTokens,
      pendingSignups: pendingSignupsCount,
      allowedOrigins: this.allowedOrigins,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Middleware for API key authentication
   */
  authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    if (!this.verifyApiKey(apiKey)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    next();
  }

  /**
   * Middleware for origin validation
   */
  validateOrigin(req, res, next) {
    const origin = req.headers.origin || req.headers.referer;
    
    if (!this.isOriginAllowed(origin)) {
      return res.status(403).json({
        success: false,
        message: 'Origin not allowed'
      });
    }

    next();
  }
}

module.exports = WebsiteIntegration;

