/**
 * TrendyX AI Level 5 Enterprise - User Database Management System
 * Advanced user data management with profile persistence
 * Fixes profile saving errors and provides robust data handling
 * Version: 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class UserDatabase {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.profilesFile = path.join(this.dataDir, 'profiles.json');
    this.sessionsFile = path.join(this.dataDir, 'sessions.json');
    this.backupDir = path.join(this.dataDir, 'backups');
    
    // In-memory cache for performance
    this.usersCache = new Map();
    this.profilesCache = new Map();
    this.sessionsCache = new Map();
    
    this.initialized = false;
    this.autoSaveInterval = options.autoSaveInterval || 30000; // 30 seconds
    this.maxBackups = options.maxBackups || 10;
    
    console.log('💾 TrendyX AI User Database System initializing...');
    this.initialize();
  }

  /**
   * Initialize database system
   */
  async initialize() {
    try {
      await this.ensureDirectories();
      await this.loadData();
      this.startAutoSave();
      this.initialized = true;
      console.log('✅ User Database System initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
      throw error;
    }
  }

  /**
   * Load data from files into memory cache
   */
  async loadData() {
    try {
      // Load users
      try {
        const usersData = await fs.readFile(this.usersFile, 'utf8');
        const users = JSON.parse(usersData);
        this.usersCache = new Map(Object.entries(users));
      } catch (error) {
        console.log('No existing users file, starting fresh');
        this.usersCache = new Map();
      }

      // Load profiles
      try {
        const profilesData = await fs.readFile(this.profilesFile, 'utf8');
        const profiles = JSON.parse(profilesData);
        this.profilesCache = new Map(Object.entries(profiles));
      } catch (error) {
        console.log('No existing profiles file, starting fresh');
        this.profilesCache = new Map();
      }

      // Load sessions
      try {
        const sessionsData = await fs.readFile(this.sessionsFile, 'utf8');
        const sessions = JSON.parse(sessionsData);
        this.sessionsCache = new Map(Object.entries(sessions));
      } catch (error) {
        console.log('No existing sessions file, starting fresh');
        this.sessionsCache = new Map();
      }

      console.log(`📊 Loaded ${this.usersCache.size} users, ${this.profilesCache.size} profiles, ${this.sessionsCache.size} sessions`);
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  /**
   * Save data to files with backup
   */
  async saveData() {
    try {
      // Create backup first
      await this.createBackup();

      // Save users
      const usersObj = Object.fromEntries(this.usersCache);
      await fs.writeFile(this.usersFile, JSON.stringify(usersObj, null, 2));

      // Save profiles
      const profilesObj = Object.fromEntries(this.profilesCache);
      await fs.writeFile(this.profilesFile, JSON.stringify(profilesObj, null, 2));

      // Save sessions
      const sessionsObj = Object.fromEntries(this.sessionsCache);
      await fs.writeFile(this.sessionsFile, JSON.stringify(sessionsObj, null, 2));

      console.log('💾 Data saved successfully');
    } catch (error) {
      console.error('❌ Error saving data:', error);
      throw new Error('Failed to save user data');
    }
  }

  /**
   * Create backup of current data
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupSubDir = path.join(this.backupDir, timestamp);
      await fs.mkdir(backupSubDir, { recursive: true });

      // Backup existing files if they exist
      const filesToBackup = [
        { src: this.usersFile, dest: path.join(backupSubDir, 'users.json') },
        { src: this.profilesFile, dest: path.join(backupSubDir, 'profiles.json') },
        { src: this.sessionsFile, dest: path.join(backupSubDir, 'sessions.json') }
      ];

      for (const file of filesToBackup) {
        try {
          await fs.copyFile(file.src, file.dest);
        } catch (error) {
          // File doesn't exist, skip
        }
      }

      // Clean old backups
      await this.cleanOldBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  /**
   * Clean old backup files
   */
  async cleanOldBackups() {
    try {
      const backups = await fs.readdir(this.backupDir);
      if (backups.length > this.maxBackups) {
        const sortedBackups = backups.sort();
        const toDelete = sortedBackups.slice(0, backups.length - this.maxBackups);
        
        for (const backup of toDelete) {
          await fs.rmdir(path.join(this.backupDir, backup), { recursive: true });
        }
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  }

  /**
   * Start auto-save interval
   */
  startAutoSave() {
    setInterval(async () => {
      try {
        await this.saveData();
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, this.autoSaveInterval);
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      const userId = uuidv4();
      const user = {
        id: userId,
        email: userData.email,
        password: userData.password, // Should be hashed by auth system
        firstName: userData.firstName,
        lastName: userData.lastName,
        company: userData.company || '',
        role: userData.role || 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
        emailVerified: false
      };

      this.usersCache.set(userData.email, user);

      // Create default profile
      const profile = {
        userId,
        avatar: null,
        bio: '',
        preferences: {
          theme: 'dark',
          notifications: true,
          aiAssistance: true,
          language: 'en',
          timezone: 'UTC'
        },
        usage: {
          quantumOperations: 0,
          neuralInferences: 0,
          predictiveAnalyses: 0,
          totalSessions: 0,
          lastActivity: new Date().toISOString()
        },
        settings: {
          dashboardLayout: 'default',
          autoSave: true,
          realTimeUpdates: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.profilesCache.set(userId, profile);

      // Save immediately for new users
      await this.saveData();

      return { success: true, user, profile };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Get user by email
   */
  getUserByEmail(email) {
    return this.usersCache.get(email) || null;
  }

  /**
   * Get user by ID
   */
  getUserById(userId) {
    for (const user of this.usersCache.values()) {
      if (user.id === userId) {
        return user;
      }
    }
    return null;
  }

  /**
   * Update user data
   */
  async updateUser(email, updates) {
    try {
      const user = this.usersCache.get(email);
      if (!user) {
        throw new Error('User not found');
      }

      // Update allowed fields
      const allowedFields = ['firstName', 'lastName', 'company', 'lastLogin', 'isActive', 'emailVerified'];
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          user[field] = updates[field];
        }
      });

      user.updatedAt = new Date().toISOString();
      this.usersCache.set(email, user);

      return { success: true, user };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Get user profile
   */
  getUserProfile(userId) {
    return this.profilesCache.get(userId) || null;
  }

  /**
   * Update user profile (FIXES PROFILE SAVING ERROR)
   */
  async updateUserProfile(userId, updates) {
    try {
      let profile = this.profilesCache.get(userId);
      
      if (!profile) {
        // Create new profile if doesn't exist
        profile = {
          userId,
          avatar: null,
          bio: '',
          preferences: {
            theme: 'dark',
            notifications: true,
            aiAssistance: true,
            language: 'en',
            timezone: 'UTC'
          },
          usage: {
            quantumOperations: 0,
            neuralInferences: 0,
            predictiveAnalyses: 0,
            totalSessions: 0,
            lastActivity: new Date().toISOString()
          },
          settings: {
            dashboardLayout: 'default',
            autoSave: true,
            realTimeUpdates: true
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Deep merge updates
      if (updates.avatar !== undefined) profile.avatar = updates.avatar;
      if (updates.bio !== undefined) profile.bio = updates.bio;
      
      if (updates.preferences) {
        profile.preferences = { ...profile.preferences, ...updates.preferences };
      }
      
      if (updates.usage) {
        profile.usage = { ...profile.usage, ...updates.usage };
      }
      
      if (updates.settings) {
        profile.settings = { ...profile.settings, ...updates.settings };
      }

      profile.updatedAt = new Date().toISOString();
      this.profilesCache.set(userId, profile);

      // Immediate save for profile updates
      await this.saveData();

      console.log(`✅ Profile updated successfully for user ${userId}`);
      return { success: true, profile };
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw new Error('Failed to save profile. Please try again.');
    }
  }

  /**
   * Record user activity
   */
  async recordActivity(userId, activityType, data = {}) {
    try {
      const profile = this.getUserProfile(userId);
      if (!profile) return;

      // Update usage statistics
      switch (activityType) {
        case 'quantum_operation':
          profile.usage.quantumOperations++;
          break;
        case 'neural_inference':
          profile.usage.neuralInferences++;
          break;
        case 'predictive_analysis':
          profile.usage.predictiveAnalyses++;
          break;
        case 'session_start':
          profile.usage.totalSessions++;
          break;
      }

      profile.usage.lastActivity = new Date().toISOString();
      this.profilesCache.set(userId, profile);

      return { success: true };
    } catch (error) {
      console.error('Error recording activity:', error);
      return { success: false };
    }
  }

  /**
   * Create user session
   */
  async createSession(sessionData) {
    try {
      const sessionId = uuidv4();
      const session = {
        id: sessionId,
        userId: sessionData.userId,
        email: sessionData.email,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress: sessionData.ipAddress || null,
        userAgent: sessionData.userAgent || null,
        isActive: true
      };

      this.sessionsCache.set(sessionId, session);
      return { success: true, sessionId, session };
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId) {
    try {
      const session = this.sessionsCache.get(sessionId);
      if (session) {
        session.lastActivity = new Date().toISOString();
        this.sessionsCache.set(sessionId, session);
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating session:', error);
      return { success: false };
    }
  }

  /**
   * End user session
   */
  async endSession(sessionId) {
    try {
      const session = this.sessionsCache.get(sessionId);
      if (session) {
        session.isActive = false;
        session.endedAt = new Date().toISOString();
        this.sessionsCache.set(sessionId, session);
      }
      return { success: true };
    } catch (error) {
      console.error('Error ending session:', error);
      return { success: false };
    }
  }

  /**
   * Get database statistics
   */
  getStats() {
    const totalUsers = this.usersCache.size;
    const totalProfiles = this.profilesCache.size;
    const activeSessions = Array.from(this.sessionsCache.values())
      .filter(session => session.isActive).length;

    const usersByRole = {};
    for (const user of this.usersCache.values()) {
      usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
    }

    return {
      totalUsers,
      totalProfiles,
      activeSessions,
      usersByRole,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export user data (for backup/migration)
   */
  async exportData() {
    try {
      return {
        users: Object.fromEntries(this.usersCache),
        profiles: Object.fromEntries(this.profilesCache),
        sessions: Object.fromEntries(this.sessionsCache),
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Import user data (for backup/migration)
   */
  async importData(data) {
    try {
      if (data.users) {
        this.usersCache = new Map(Object.entries(data.users));
      }
      if (data.profiles) {
        this.profilesCache = new Map(Object.entries(data.profiles));
      }
      if (data.sessions) {
        this.sessionsCache = new Map(Object.entries(data.sessions));
      }

      await this.saveData();
      return { success: true };
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const now = new Date();
      let cleaned = 0;

      for (const [sessionId, session] of this.sessionsCache.entries()) {
        const lastActivity = new Date(session.lastActivity);
        if (now - lastActivity > maxAge) {
          this.sessionsCache.delete(sessionId);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        await this.saveData();
        console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
      }

      return { success: true, cleaned };
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      return { success: false };
    }
  }
}

module.exports = UserDatabase;

