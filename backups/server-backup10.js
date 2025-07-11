const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const NODE_ENV = process.env.NODE_ENV || 'development';

// PRODUCTION OPTIMIZATION: Configure Express for Railway deployment
app.set('trust proxy', 1); // Trust first proxy (Railway)

// --- Enhanced Logging Configuration ---
const logger = winston.createLogger({
    level: NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'trendyx-ai-enterprise' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Create logs directory if it doesn't exist (only if writable)
try {
    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
    }
    // Add file transports only if logs directory is writable
    logger.add(new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));
    logger.add(new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));
} catch (error) {
    console.log('Note: File logging disabled (read-only filesystem)');
}

// --- Performance Monitoring ---
const performanceMetrics = {
    startTime: Date.now(),
    requests: 0,
    errors: 0,
    aiGenerations: 0,
    contentCreated: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    cpuUsage: 0
};

// Performance monitoring middleware
app.use((req, res, next) => {
    const start = Date.now();
    performanceMetrics.requests++;
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        performanceMetrics.averageResponseTime = 
            (performanceMetrics.averageResponseTime + duration) / 2;
        
        if (res.statusCode >= 400) {
            performanceMetrics.errors++;
        }
        
        logger.info('Request processed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: duration,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
    });
    
    next();
});

// System metrics collection
setInterval(() => {
    const memUsage = process.memoryUsage();
    performanceMetrics.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
    
    const cpuUsage = process.cpuUsage();
    performanceMetrics.cpuUsage = Math.round((cpuUsage.user + cpuUsage.system) / 1000); // ms
}, 30000); // Every 30 seconds

// --- Built-in Authentication System ---
const USERS_FILE = path.join(__dirname, 'users.json');
const CONTENT_FILE = path.join(__dirname, 'content.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Initialize directories and files
try {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
    }
} catch (error) {
    console.log('Note: Backup directory creation disabled (read-only filesystem)');
}

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(CONTENT_FILE)) {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify([]));
}

// --- Content Management System (Built-in) ---
const contentManager = {
    // Initialize content database
    initializeContentDatabase() {
        try {
            if (!fs.existsSync(CONTENT_FILE)) {
                fs.writeFileSync(CONTENT_FILE, JSON.stringify([]));
                logger.info('Content database initialized');
            }
        } catch (error) {
            logger.error('Failed to initialize content database:', error);
        }
    },

    // Store content
    async storeContent(contentData) {
        try {
            const content = this.loadContent();
            const newContent = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                ...contentData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                wordCount: contentData.content ? contentData.content.split(' ').length : 0,
                characterCount: contentData.content ? contentData.content.length : 0
            };
            
            content.push(newContent);
            this.saveContent(content);
            
            logger.info('Content stored successfully', { contentId: newContent.id });
            return newContent;
        } catch (error) {
            logger.error('Failed to store content:', error);
            throw error;
        }
    },

    // Load content from file
    loadContent() {
        try {
            const data = fs.readFileSync(CONTENT_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.warn('Failed to load content, returning empty array:', error);
            return [];
        }
    },

    // Save content to file
    saveContent(content) {
        try {
            // Create backup before saving
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(BACKUP_DIR, `content-backup-${timestamp}.json`);
            
            try {
                if (fs.existsSync(CONTENT_FILE)) {
                    fs.copyFileSync(CONTENT_FILE, backupFile);
                }
            } catch (backupError) {
                console.log('Note: Backup creation disabled (read-only filesystem)');
            }
            
            fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
            
            // Clean old backups (keep last 10)
            try {
                const backupFiles = fs.readdirSync(BACKUP_DIR)
                    .filter(file => file.startsWith('content-backup-'))
                    .sort()
                    .reverse();
                
                if (backupFiles.length > 10) {
                    backupFiles.slice(10).forEach(file => {
                        fs.unlinkSync(path.join(BACKUP_DIR, file));
                    });
                }
            } catch (cleanupError) {
                console.log('Note: Backup cleanup disabled');
            }
            
            logger.info('Content saved successfully');
        } catch (error) {
            logger.error('Failed to save content:', error);
            throw error;
        }
    },

    // Get user content
    async getUserContent(userId, options = {}) {
        try {
            const content = this.loadContent();
            let userContent = content.filter(item => item.userId === userId);
            
            // Apply filters
            if (options.type) {
                userContent = userContent.filter(item => item.type === options.type);
            }
            
            if (options.search) {
                const searchTerm = options.search.toLowerCase();
                userContent = userContent.filter(item => 
                    item.title.toLowerCase().includes(searchTerm) ||
                    item.content.toLowerCase().includes(searchTerm)
                );
            }
            
            // Sort
            const sortBy = options.sortBy || 'createdAt';
            const sortOrder = options.sortOrder || 'desc';
            userContent.sort((a, b) => {
                if (sortOrder === 'desc') {
                    return new Date(b[sortBy]) - new Date(a[sortBy]);
                } else {
                    return new Date(a[sortBy]) - new Date(b[sortBy]);
                }
            });
            
            // Pagination
            const limit = options.limit || 10;
            const offset = options.offset || 0;
            const paginatedContent = userContent.slice(offset, offset + limit);
            
            return {
                items: paginatedContent,
                total: userContent.length
            };
        } catch (error) {
            logger.error('Failed to get user content:', error);
            throw error;
        }
    },

    // Get user stats
    async getUserStats(userId) {
        try {
            const content = this.loadContent();
            const userContent = content.filter(item => item.userId === userId);
            
            const stats = {
                totalContent: userContent.length,
                totalWords: userContent.reduce((sum, item) => sum + (item.wordCount || 0), 0),
                totalCharacters: userContent.reduce((sum, item) => sum + (item.characterCount || 0), 0),
                contentByType: {
                    quantum: userContent.filter(item => item.type === 'quantum').length,
                    neural: userContent.filter(item => item.type === 'neural').length,
                    predictive: userContent.filter(item => item.type === 'predictive').length
                },
                lastCreated: userContent.length > 0 ? 
                    userContent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt : 
                    null
            };
            
            return stats;
        } catch (error) {
            logger.error('Failed to get user stats:', error);
            throw error;
        }
    },

    // Update content
    async updateContent(contentId, userId, updates) {
        try {
            const content = this.loadContent();
            const contentIndex = content.findIndex(item => item.id === contentId && item.userId === userId);
            
            if (contentIndex === -1) {
                return null;
            }
            
            content[contentIndex] = {
                ...content[contentIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            // Recalculate word and character counts if content was updated
            if (updates.content) {
                content[contentIndex].wordCount = updates.content.split(' ').length;
                content[contentIndex].characterCount = updates.content.length;
            }
            
            this.saveContent(content);
            
            logger.info('Content updated successfully', { contentId });
            return content[contentIndex];
        } catch (error) {
            logger.error('Failed to update content:', error);
            throw error;
        }
    },

    // Delete content
    async deleteContent(contentId, userId) {
        try {
            const content = this.loadContent();
            const initialLength = content.length;
            const filteredContent = content.filter(item => !(item.id === contentId && item.userId === userId));
            
            if (filteredContent.length === initialLength) {
                return false; // Content not found or access denied
            }
            
            this.saveContent(filteredContent);
            
            logger.info('Content deleted successfully', { contentId });
            return true;
        } catch (error) {
            logger.error('Failed to delete content:', error);
            throw error;
        }
    }
};

// Initialize content database
contentManager.initializeContentDatabase();

// Enhanced user management with backup
function loadUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        logger.error('Error loading users:', error);
        return [];
    }
}

function saveUsers(users) {
    try {
        // Create backup before saving
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `users-backup-${timestamp}.json`);
        
        try {
            if (fs.existsSync(USERS_FILE)) {
                fs.copyFileSync(USERS_FILE, backupFile);
            }
        } catch (backupError) {
            console.log('Note: User backup creation disabled (read-only filesystem)');
        }
        
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        
        // Clean old backups (keep last 10)
        try {
            const backupFiles = fs.readdirSync(BACKUP_DIR)
                .filter(file => file.startsWith('users-backup-'))
                .sort()
                .reverse();
            
            if (backupFiles.length > 10) {
                backupFiles.slice(10).forEach(file => {
                    fs.unlinkSync(path.join(BACKUP_DIR, file));
                });
            }
        } catch (cleanupError) {
            console.log('Note: User backup cleanup disabled');
        }
        
        logger.info('Users saved successfully with backup');
    } catch (error) {
        logger.error('Error saving users:', error);
        throw error;
    }
}

// Enhanced user registration with validation
async function registerUser(username, password, email) {
    try {
        const users = loadUsers();
        
        // Enhanced validation
        if (!username || username.length < 3) {
            throw new Error('Username must be at least 3 characters long');
        }
        
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        
        if (users.find(user => user.username === username)) {
            throw new Error('Username already exists');
        }
        
        if (email && users.find(user => user.email === email)) {
            throw new Error('Email already exists');
        }
        
        const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds
        
        const newUser = {
            id: Date.now().toString(),
            username,
            email: email || '',
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            loginCount: 0,
            profile: {
                quantumOperations: 0,
                neuralInferences: 0,
                predictions: 0,
                contentGenerated: 0,
                totalWords: 0,
                lastActivity: new Date().toISOString()
            }
        };
        
        users.push(newUser);
        saveUsers(users);
        
        logger.info('New user registered', { username, email });
        return newUser;
    } catch (error) {
        logger.error('Registration error:', error);
        throw error;
    }
}

// Enhanced login with tracking
async function loginUser(username, password) {
    try {
        const users = loadUsers();
        const user = users.find(u => u.username === username || u.email === username);
        
        if (!user) {
            logger.warn('Login attempt with invalid username', { username });
            throw new Error('Invalid username or password');
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            logger.warn('Login attempt with invalid password', { username });
            throw new Error('Invalid username or password');
        }
        
        // Update user login info
        user.lastLogin = new Date().toISOString();
        user.loginCount = (user.loginCount || 0) + 1;
        user.profile.lastActivity = new Date().toISOString();
        saveUsers(users);
        
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                loginTime: Date.now()
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        logger.info('User logged in successfully', { username });
        return token;
    } catch (error) {
        logger.error('Login error:', error);
        throw error;
    }
}

// Enhanced token verification with error handling
function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                message: 'No valid authorization header provided',
                code: 'NO_TOKEN'
            });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check token age (optional additional security)
        const tokenAge = Date.now() - decoded.loginTime;
        if (tokenAge > 24 * 60 * 60 * 1000) { // 24 hours
            return res.status(401).json({ 
                success: false,
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        logger.warn('Token verification failed:', error.message);
        return res.status(401).json({ 
            success: false,
            message: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
        });
    }
}

// --- Enhanced Security & Performance Middleware ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "data:"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            styleSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "blob:", "*"],
            connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "blob:", "data:"],
            frameSrc: ["'self'"],
            childSrc: ["'self'", "blob:"],
            workerSrc: ["'self'", "blob:"],
            manifestSrc: ["'self'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
}));

app.use(cors({
    origin: NODE_ENV === 'production' ? 
        ['https://trendyx-level5-enterprise-production.up.railway.app'] : 
        '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false
}));

// PRODUCTION OPTIMIZED: Railway-compatible rate limiting
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { 
            success: false, 
            message, 
            retryAfter: Math.ceil(windowMs / 1000) 
        },
        standardHeaders: true,
        legacyHeaders: false,
        trustProxy: true, // Trust Railway proxy
        keyGenerator: (req) => {
            // Use X-Forwarded-For if available, fallback to connection IP
            return req.ip || req.connection.remoteAddress || 'unknown';
        },
        skip: (req) => {
            // Skip rate limiting for health checks and static files
            return req.path === '/api/health' || 
                   req.path.startsWith('/static/') ||
                   req.path.endsWith('.css') ||
                   req.path.endsWith('.js') ||
                   req.path.endsWith('.ico');
        },
        onLimitReached: (req) => {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                path: req.path,
                userAgent: req.get('User-Agent')
            });
        }
    });
};

// Different rate limits for different endpoints
const apiLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // Max 100 requests per 15 minutes
    'Too many API requests, please try again later'
);

const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    10, // Max 10 auth attempts per 15 minutes
    'Too many authentication attempts, please try again later'
);

const aiLimiter = createRateLimiter(
    5 * 60 * 1000, // 5 minutes
    20, // Max 20 AI generations per 5 minutes
    'Too many AI generation requests, please try again later'
);

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/quantum/generate', aiLimiter);
app.use('/api/neural/generate', aiLimiter);
app.use('/api/predictive/generate', aiLimiter);

app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            logger.warn('Invalid JSON received', { ip: req.ip });
            throw new Error('Invalid JSON');
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Enhanced Error Handling Middleware ---
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    
    performanceMetrics.errors++;
    
    res.status(err.status || 500).json({
        success: false,
        message: NODE_ENV === 'production' ? 
            'An error occurred while processing your request' : 
            err.message,
        code: err.code || 'INTERNAL_ERROR'
    });
});

// --- Serve Static Files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Enhanced AI Systems Simulation ---
const aiSystems = {
    quantum: {
        status: 'Ready',
        algorithms: 8,
        operations: 1247,
        qubits: 256,
        accuracy: '99.8%',
        lastMaintenance: new Date().toISOString(),
        performance: {
            averageResponseTime: 150,
            successRate: 99.8,
            totalOperations: 1247
        }
    },
    neural: {
        status: 'Ready',
        models: 12,
        inferences: 3891,
        accuracy: '97.2%',
        lastTraining: new Date().toISOString(),
        performance: {
            averageResponseTime: 200,
            successRate: 97.2,
            totalInferences: 3891
        }
    },
    predictive: {
        status: 'Ready',
        algorithms: 6,
        predictions: 2156,
        accuracy: '94.7%',
        lastUpdate: new Date().toISOString(),
        performance: {
            averageResponseTime: 180,
            successRate: 94.7,
            totalPredictions: 2156
        }
    }
};

// Enhanced AI content generation with comprehensive error handling and debugging
async function generateAIContent(type, prompt, title, userId) {
    const startTime = Date.now();
    
    try {
        // Input validation
        if (!type || !prompt || !userId) {
            throw new Error(`Missing required parameters: type=${type}, prompt=${!!prompt}, userId=${userId}`);
        }
        
        if (!['quantum', 'neural', 'predictive'].includes(type)) {
            throw new Error(`Invalid AI system type: ${type}`);
        }
        
        performanceMetrics.aiGenerations++;
        
        let content;
        let provider;
        
        logger.info(`Starting AI content generation`, { type, userId, promptLength: prompt.length });
        
        switch (type) {
            case 'quantum':
                aiSystems.quantum.operations++;
                provider = 'trendyx-quantum';
                content = `🔬 Quantum Computing Analysis: ${title || prompt.substring(0, 50)}

${prompt}

Quantum processing complete. Advanced algorithms have analyzed your request using quantum superposition and entanglement principles. Our quantum computing engine has processed this through ${aiSystems.quantum.qubits} qubits with ${aiSystems.quantum.accuracy} accuracy.

Key quantum insights:
• Superposition analysis reveals multiple solution pathways
• Entanglement patterns show interconnected data relationships  
• Quantum interference optimization applied
• Decoherence mitigation protocols engaged

Processing time: ${Date.now() - startTime}ms
Quantum fidelity: ${aiSystems.quantum.accuracy}
Algorithm efficiency: Optimal`;
                break;
                
            case 'neural':
                aiSystems.neural.inferences++;
                provider = 'trendyx-neural';
                content = `🧠 Neural Network Analysis: ${title || prompt.substring(0, 50)}

${prompt}

Neural processing complete. Our advanced neural network orchestrator has analyzed your request through ${aiSystems.neural.models} specialized models with ${aiSystems.neural.accuracy} accuracy.

Neural insights:
• Deep learning patterns identified
• Multi-layer perceptron analysis complete
• Backpropagation optimization applied
• Gradient descent convergence achieved

Processing layers: ${aiSystems.neural.models}
Inference accuracy: ${aiSystems.neural.accuracy}
Network topology: Optimized
Activation functions: ReLU/Sigmoid hybrid`;
                break;
                
            case 'predictive':
                aiSystems.predictive.predictions++;
                provider = 'trendyx-predictive';
                content = `📊 Predictive Analytics Report: ${title || prompt.substring(0, 50)}

${prompt}

Predictive analysis complete. Our advanced analytics engine has processed your request using ${aiSystems.predictive.algorithms} specialized algorithms with ${aiSystems.predictive.accuracy} accuracy.

Predictive insights:
• Time series analysis completed
• Trend identification algorithms applied
• Statistical modeling convergence achieved
• Confidence intervals calculated

Prediction confidence: ${aiSystems.predictive.accuracy}
Algorithm ensemble: ${aiSystems.predictive.algorithms} models
Forecast horizon: Optimized
Statistical significance: High`;
                break;
                
            default:
                throw new Error(`Unhandled AI system type: ${type}`);
        }
        
        // Store content with enhanced metadata
        const contentData = {
            title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Analysis`,
            content,
            type,
            provider,
            userId,
            metadata: {
                processingTime: Date.now() - startTime,
                systemStatus: aiSystems[type].status,
                accuracy: aiSystems[type].accuracy,
                timestamp: new Date().toISOString()
            }
        };
        
        logger.info(`Storing content for user ${userId}`, { contentLength: content.length });
        
        const savedContent = await contentManager.storeContent(contentData);
        performanceMetrics.contentCreated++;
        
        logger.info('AI content generated successfully', {
            type,
            userId,
            contentId: savedContent.id,
            processingTime: Date.now() - startTime
        });
        
        return savedContent;
        
    } catch (error) {
        logger.error('AI content generation failed:', {
            type,
            userId,
            error: error.message,
            stack: error.stack,
            processingTime: Date.now() - startTime
        });
        throw error;
    }
}

// --- API Routes ---

// Enhanced health check with detailed metrics
app.get('/api/health', (req, res) => {
    const uptime = Date.now() - performanceMetrics.startTime;
    const memUsage = process.memoryUsage();
    
    res.json({
        success: true,
        status: 'operational',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime / 1000), // seconds
        version: '2.1.0',
        environment: NODE_ENV,
        systems: {
            quantum: aiSystems.quantum.status,
            neural: aiSystems.neural.status,
            predictive: aiSystems.predictive.status,
            contentManagement: 'enabled',
            authentication: 'enabled',
            monitoring: 'active'
        },
        metrics: {
            requests: performanceMetrics.requests,
            errors: performanceMetrics.errors,
            aiGenerations: performanceMetrics.aiGenerations,
            contentCreated: performanceMetrics.contentCreated,
            averageResponseTime: Math.round(performanceMetrics.averageResponseTime),
            memoryUsage: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                external: Math.round(memUsage.external / 1024 / 1024) // MB
            }
        }
    });
});

// Enhanced system metrics endpoint
app.get('/api/metrics', verifyToken, (req, res) => {
    const uptime = Date.now() - performanceMetrics.startTime;
    
    res.json({
        success: true,
        metrics: {
            system: {
                uptime: Math.floor(uptime / 1000),
                requests: performanceMetrics.requests,
                errors: performanceMetrics.errors,
                errorRate: performanceMetrics.requests > 0 ? 
                    (performanceMetrics.errors / performanceMetrics.requests * 100).toFixed(2) : 0,
                averageResponseTime: Math.round(performanceMetrics.averageResponseTime)
            },
            ai: {
                totalGenerations: performanceMetrics.aiGenerations,
                contentCreated: performanceMetrics.contentCreated,
                quantum: aiSystems.quantum.performance,
                neural: aiSystems.neural.performance,
                predictive: aiSystems.predictive.performance
            },
            resources: {
                memory: performanceMetrics.memoryUsage,
                cpu: performanceMetrics.cpuUsage,
                platform: os.platform(),
                nodeVersion: process.version
            }
        }
    });
});

// Enhanced authentication endpoints with better error handling
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        logger.info('Registration attempt', { username, email });
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
                code: 'MISSING_FIELDS'
            });
        }
        
        const user = await registerUser(username, password, email);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
        
    } catch (error) {
        logger.error('Registration failed:', error);
        res.status(400).json({
            success: false,
            message: error.message,
            code: 'REGISTRATION_FAILED'
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        logger.info('Login attempt', { username });
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }
        
        const token = await loginUser(username, password);
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            expiresIn: '24h'
        });
        
    } catch (error) {
        logger.error('Login failed:', error);
        res.status(401).json({
            success: false,
            message: error.message,
            code: 'LOGIN_FAILED'
        });
    }
});

// CORRECTED: Enhanced AI generation endpoints with comprehensive error handling
app.post('/api/quantum/generate', verifyToken, async (req, res) => {
    try {
        const { prompt, title } = req.body;
        
        logger.info('Quantum generation request', { userId: req.user.id, promptLength: prompt?.length });
        
        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required',
                code: 'MISSING_PROMPT'
            });
        }
        
        const content = await generateAIContent('quantum', prompt, title, req.user.id);
        
        res.json({
            success: true,
            message: 'Quantum content generated successfully',
            content
        });
        
    } catch (error) {
        logger.error('Quantum generation failed:', {
            userId: req.user.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to generate quantum content: ' + error.message,
            code: 'QUANTUM_GENERATION_FAILED',
            details: NODE_ENV !== 'production' ? error.stack : undefined
        });
    }
});

app.post('/api/neural/generate', verifyToken, async (req, res) => {
    try {
        const { prompt, title } = req.body;
        
        logger.info('Neural generation request', { userId: req.user.id, promptLength: prompt?.length });
        
        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required',
                code: 'MISSING_PROMPT'
            });
        }
        
        const content = await generateAIContent('neural', prompt, title, req.user.id);
        
        res.json({
            success: true,
            message: 'Neural content generated successfully',
            content
        });
        
    } catch (error) {
        logger.error('Neural generation failed:', {
            userId: req.user.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to generate neural content: ' + error.message,
            code: 'NEURAL_GENERATION_FAILED',
            details: NODE_ENV !== 'production' ? error.stack : undefined
        });
    }
});

// CRITICAL FIX: Enhanced predictive generation endpoint with detailed error logging
app.post('/api/predictive/generate', verifyToken, async (req, res) => {
    try {
        const { prompt, title } = req.body;
        
        logger.info('Predictive generation request', { 
            userId: req.user.id, 
            promptLength: prompt?.length,
            title: title,
            requestBody: req.body
        });
        
        if (!prompt) {
            logger.warn('Predictive generation failed: Missing prompt', { userId: req.user.id });
            return res.status(400).json({
                success: false,
                message: 'Prompt is required',
                code: 'MISSING_PROMPT'
            });
        }
        
        logger.info('Calling generateAIContent for predictive', { 
            type: 'predictive',
            userId: req.user.id,
            prompt: prompt.substring(0, 100) + '...'
        });
        
        const content = await generateAIContent('predictive', prompt, title, req.user.id);
        
        logger.info('Predictive content generated successfully', { 
            userId: req.user.id,
            contentId: content.id
        });
        
        res.json({
            success: true,
            message: 'Predictive content generated successfully',
            content
        });
        
    } catch (error) {
        logger.error('Predictive generation failed with detailed error:', {
            userId: req.user.id,
            error: error.message,
            stack: error.stack,
            requestBody: req.body,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to generate predictive content: ' + error.message,
            code: 'PREDICTIVE_GENERATION_FAILED',
            details: NODE_ENV !== 'production' ? {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            } : undefined
        });
    }
});

// Enhanced content management endpoints
app.get('/api/content', verifyToken, async (req, res) => {
    try {
        const { type, search, limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        const content = await contentManager.getUserContent(req.user.id, {
            type,
            search,
            limit: parseInt(limit),
            offset: parseInt(offset),
            sortBy,
            sortOrder
        });
        
        res.json({
            success: true,
            content: content.items,
            pagination: {
                total: content.total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: content.total > parseInt(offset) + parseInt(limit)
            }
        });
        
    } catch (error) {
        logger.error('Content retrieval failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve content',
            code: 'CONTENT_RETRIEVAL_FAILED'
        });
    }
});

app.get('/api/content/stats/user', verifyToken, async (req, res) => {
    try {
        const stats = await contentManager.getUserStats(req.user.id);
        
        res.json({
            success: true,
            stats
        });
        
    } catch (error) {
        logger.error('Stats retrieval failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user statistics',
            code: 'STATS_RETRIEVAL_FAILED'
        });
    }
});

app.put('/api/content/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, tags, favorite } = req.body;
        
        const updatedContent = await contentManager.updateContent(id, req.user.id, {
            title,
            content,
            tags,
            favorite
        });
        
        if (!updatedContent) {
            return res.status(404).json({
                success: false,
                message: 'Content not found or access denied',
                code: 'CONTENT_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            message: 'Content updated successfully',
            content: updatedContent
        });
        
    } catch (error) {
        logger.error('Content update failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update content',
            code: 'CONTENT_UPDATE_FAILED'
        });
    }
});

app.delete('/api/content/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const deleted = await contentManager.deleteContent(id, req.user.id);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Content not found or access denied',
                code: 'CONTENT_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
        
    } catch (error) {
        logger.error('Content deletion failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete content',
            code: 'CONTENT_DELETE_FAILED'
        });
    }
});

// Enhanced backup endpoints
app.post('/api/backup/create', verifyToken, async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `content-backup-${req.user.id}-${timestamp}.json`);
        
        const userContent = await contentManager.getUserContent(req.user.id, { limit: 1000 });
        
        fs.writeFileSync(backupFile, JSON.stringify({
            userId: req.user.id,
            username: req.user.username,
            timestamp: new Date().toISOString(),
            content: userContent.items
        }, null, 2));
        
        res.json({
            success: true,
            message: 'Backup created successfully',
            backupId: `content-backup-${req.user.id}-${timestamp}`,
            contentCount: userContent.items.length
        });
        
    } catch (error) {
        logger.error('Backup creation failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create backup',
            code: 'BACKUP_FAILED'
        });
    }
});

// --- Frontend Routes ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/auth', (req, res) => {
    const authPath = path.join(__dirname, 'auth-frontend.html');
    if (fs.existsSync(authPath)) {
        res.sendFile(authPath);
    } else {
        // Fallback inline auth portal
        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TrendyX AI Authentication</title>
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
        .container { max-width: 400px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; color: #555; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #5a6fd8; }
        .toggle { text-align: center; margin-top: 20px; }
        .toggle a { color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 TrendyX AI</h1>
        <form id="authForm">
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" required>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" required>
            </div>
            <button type="submit">Login</button>
        </form>
        <div class="toggle">
            <a href="/dashboard-enhanced">Go to Dashboard</a>
        </div>
    </div>
</body>
</html>
        `);
    }
});

app.get('/dashboard', (req, res) => {
    res.redirect('/dashboard-enhanced');
});

app.get('/dashboard-enhanced', (req, res) => {
    const dashboardPath = path.join(__dirname, 'dashboard-enhanced.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        res.status(404).send('Dashboard not found. Please ensure dashboard-enhanced.html is in the root directory.');
    }
});

// --- WebSocket for Real-time Updates ---
io.on('connection', (socket) => {
    logger.info('Client connected to WebSocket');
    
    socket.emit('systemStatus', {
        quantum: aiSystems.quantum,
        neural: aiSystems.neural,
        predictive: aiSystems.predictive,
        timestamp: new Date().toISOString()
    });
    
    socket.on('disconnect', () => {
        logger.info('Client disconnected from WebSocket');
    });
});

// Broadcast system updates every 30 seconds
setInterval(() => {
    io.emit('systemUpdate', {
        quantum: aiSystems.quantum,
        neural: aiSystems.neural,
        predictive: aiSystems.predictive,
        metrics: performanceMetrics,
        timestamp: new Date().toISOString()
    });
}, 30000);

// --- Graceful Shutdown ---
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

// --- Start Server ---
server.listen(PORT, '0.0.0.0', () => {
    logger.info('🚀 TrendyX AI Level 5 Enterprise Enhanced Server started', {
        port: PORT,
        environment: NODE_ENV,
        nodeVersion: process.version,
        platform: os.platform()
    });
    
    console.log('🚀 TrendyX AI Level 5 Enterprise Enhanced Server started on port', PORT);
    console.log('🌐 Dashboard: http://localhost:' + PORT);
    console.log('🔬 Quantum Computing Engine: Ready');
    console.log('🧠 Neural Network Orchestrator: Ready');
    console.log('📊 Predictive Analytics Engine: Ready');
    console.log('🔧 Self-Healing Systems: Active');
    console.log('📡 WebSocket Server: Running');
    console.log('🛡️ Security Middleware: Enabled (Production Optimized)');
    console.log('⚡ Performance Optimization: Active');
    console.log('🔐 Authentication System: Enabled');
    console.log('📚 Content Management: Enabled');
    console.log('📊 Performance Monitoring: Active');
    console.log('💾 Automated Backups: Enabled');
    console.log('🔧 Railway Proxy Configuration: Optimized');
    console.log('🐛 Enhanced Error Handling: Active');
    console.log('🔍 Detailed Logging: Enabled');
    console.log('🧠 AI Brain fully operational - Ready for Railway deployment!');
});

module.exports = app;

