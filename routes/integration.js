const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const INTEGRATION_API_KEY = process.env.INTEGRATION_API_KEY || 'website-integration-key-2024';
const USERS_FILE = path.join(__dirname, '..', 'users.json');

// Middleware to verify API key for integration endpoints
function verifyIntegrationKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.body.apiKey || INTEGRATION_API_KEY;
    
    if (apiKey !== INTEGRATION_API_KEY) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid API key for integration' 
        });
    }
    
    next();
}

// Load users from file
function loadUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            fs.writeFileSync(USERS_FILE, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

// Save users to file
function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

// Create TrendyX AI account from website integration
router.post('/create-account', async (req, res) => {
    try {
        const { firstName, lastName, email, username, password } = req.body;
        
        // Validate required fields
        if (!username || !password || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and email are required'
            });
        }
        
        // Validate username format
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username must be 3-20 characters, alphanumeric and underscores only'
            });
        }
        
        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Validate email format
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        const users = loadUsers();
        
        // Check if username already exists
        if (users.find(user => user.username === username)) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        
        // Check if email already exists
        if (users.find(user => user.email === email)) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            firstName: firstName || '',
            lastName: lastName || '',
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            source: 'website_integration',
            profile: {
                quantumOperations: 0,
                neuralInferences: 0,
                predictions: 0,
                websiteIntegrated: true
            }
        };
        
        // Add user to database
        users.push(newUser);
        
        if (!saveUsers(users)) {
            throw new Error('Failed to save user to database');
        }
        
        // Generate JWT token for immediate login
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Log successful integration
        console.log('Website integration: User created successfully -', username);
        
        // Return success response
        res.status(201).json({
            success: true,
            message: 'TrendyX AI account created successfully',
            data: {
                userId: newUser.id,
                username: newUser.username,
                email: newUser.email,
                token: token,
                trendyxUrl: '/dashboard',
                createdAt: newUser.createdAt
            }
        });
        
    } catch (error) {
        console.error('Integration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during account creation'
        });
    }
});

// Verify user from website integration
router.post('/verify-user', verifyIntegrationKey, async (req, res) => {
    try {
        const { username, token } = req.body;
        
        if (!username && !token) {
            return res.status(400).json({
                success: false,
                message: 'Username or token is required'
            });
        }
        
        const users = loadUsers();
        let user = null;
        
        if (token) {
            // Verify JWT token
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                user = users.find(u => u.id === decoded.id);
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }
        } else if (username) {
            // Find user by username
            user = users.find(u => u.username === username);
        }
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Return user information
        res.json({
            success: true,
            message: 'User verified successfully',
            data: {
                userId: user.id,
                username: user.username,
                email: user.email,
                profile: user.profile,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });
        
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during verification'
        });
    }
});

// Get integration statistics
router.get('/stats', verifyIntegrationKey, (req, res) => {
    try {
        const users = loadUsers();
        const websiteUsers = users.filter(user => user.source === 'website_integration');
        
        const stats = {
            totalUsers: users.length,
            websiteIntegratedUsers: websiteUsers.length,
            recentSignups: users.filter(user => {
                const signupDate = new Date(user.createdAt);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return signupDate > dayAgo;
            }).length,
            activeUsers: users.filter(user => user.lastLogin).length
        };
        
        res.json({
            success: true,
            message: 'Integration statistics retrieved',
            data: stats
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error retrieving stats'
        });
    }
});

// Health check for integration system
router.get('/health', (req, res) => {
    try {
        const users = loadUsers();
        
        res.json({
            success: true,
            message: 'Integration system is healthy',
            data: {
                status: 'operational',
                timestamp: new Date().toISOString(),
                userDatabaseStatus: 'connected',
                totalUsers: users.length,
                integrationApiKey: 'configured'
            }
        });
        
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Integration system health check failed'
        });
    }
});

// Sync user data (for advanced integrations)
router.post('/sync-user', verifyIntegrationKey, async (req, res) => {
    try {
        const { userId, updateData } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        const users = loadUsers();
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update user data
        if (updateData) {
            users[userIndex] = { ...users[userIndex], ...updateData };
            users[userIndex].updatedAt = new Date().toISOString();
        }
        
        if (!saveUsers(users)) {
            throw new Error('Failed to save updated user data');
        }
        
        res.json({
            success: true,
            message: 'User data synchronized successfully',
            data: {
                userId: users[userIndex].id,
                username: users[userIndex].username,
                updatedAt: users[userIndex].updatedAt
            }
        });
        
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during sync'
        });
    }
});

module.exports = router;

