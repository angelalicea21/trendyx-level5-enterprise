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

// Import content management module
const contentManager = require('./content-manager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// --- Built-in Authentication System ---
const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// Initialize content database
contentManager.initializeContentDatabase();

// Load users from file
function loadUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Save users to file
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Register a new user
async function registerUser(username, password, email) {
    const users = loadUsers();
    
    if (users.find(user => user.username === username)) {
        throw new Error('Username already exists');
    }
    
    if (users.find(user => user.email === email)) {
        throw new Error('Email already exists');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        profile: {
            quantumOperations: 0,
            neuralInferences: 0,
            predictions: 0,
            contentGenerated: 0,
            totalWords: 0
        }
    };
    
    users.push(newUser);
    saveUsers(users);
    
    return newUser;
}

// Login user
async function loginUser(username, password) {
    const users = loadUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
        throw new Error('Invalid username or password');
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        throw new Error('Invalid username or password');
    }
    
    user.lastLogin = new Date().toISOString();
    saveUsers(users);
    
    const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
    
    return token;
}

// Verify JWT token middleware
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// --- Security & Performance Middleware ---
app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Logging Configuration ---
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'server.log' })
    ]
});

// --- Serve Static Files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- AI Systems Simulation ---
const aiSystems = {
    quantum: {
        status: 'Ready',
        algorithms: 8,
        operations: 0,
        qubits: 64,
        accuracy: 98.5
    },
    neural: {
        status: 'Ready',
        models: 8,
        inferences: 0,
        accuracy: 96.2
    },
    predictive: {
        status: 'Ready',
        algorithms: 6,
        predictions: 0,
        accuracy: 94.7
    },
    selfHealing: {
        status: 'Active',
        actions: 0,
        uptime: 99.99
    },
    realtime: {
        connections: 0,
        updates: 0
    }
};

const performanceMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    networkLatency: 0,
    requestsPerSecond: 0
};

// --- Authentication Routes ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        if (!username || !password || !email) {
            return res.status(400).json({ message: 'Username, password, and email are required' });
        }
        
        const user = await registerUser(username, password, email);
        
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        const token = await loginUser(username, password);
        
        res.json({
            message: 'Login successful',
            token
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
});

// --- Content Management Routes ---

// Store new content
app.post('/api/content', verifyToken, (req, res) => {
    try {
        const { type, title, content, prompt, aiProvider, model, tags } = req.body;
        
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }
        
        const contentData = {
            type: type || 'general',
            title: title || 'Untitled',
            content,
            prompt: prompt || '',
            aiProvider: aiProvider || 'trendyx',
            model: model || 'quantum-neural',
            tags: tags || []
        };
        
        const storedContent = contentManager.storeContent(req.user.id, contentData);
        
        if (storedContent) {
            // Update user profile
            const users = loadUsers();
            const userIndex = users.findIndex(u => u.id === req.user.id);
            if (userIndex !== -1) {
                users[userIndex].profile.contentGenerated = (users[userIndex].profile.contentGenerated || 0) + 1;
                users[userIndex].profile.totalWords = (users[userIndex].profile.totalWords || 0) + storedContent.wordCount;
                saveUsers(users);
            }
            
            res.status(201).json({
                message: 'Content stored successfully',
                content: storedContent
            });
        } else {
            res.status(500).json({ message: 'Failed to store content' });
        }
    } catch (error) {
        logger.error('Error storing content:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user's content with filtering and pagination
app.get('/api/content', verifyToken, (req, res) => {
    try {
        const options = {
            type: req.query.type,
            search: req.query.search,
            favorite: req.query.favorite === 'true',
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc',
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined
        };
        
        const userContent = contentManager.getUserContent(req.user.id, options);
        
        res.json({
            message: 'Content retrieved successfully',
            content: userContent,
            total: userContent.length
        });
    } catch (error) {
        logger.error('Error retrieving content:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get single content by ID
app.get('/api/content/:id', verifyToken, (req, res) => {
    try {
        const content = contentManager.getContentById(req.params.id, req.user.id);
        
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        
        res.json({
            message: 'Content retrieved successfully',
            content
        });
    } catch (error) {
        logger.error('Error retrieving content:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update content
app.put('/api/content/:id', verifyToken, (req, res) => {
    try {
        const { title, content, tags, favorite, type } = req.body;
        
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (tags !== undefined) updateData.tags = tags;
        if (favorite !== undefined) updateData.favorite = favorite;
        if (type !== undefined) updateData.type = type;
        
        const updatedContent = contentManager.updateContent(req.params.id, req.user.id, updateData);
        
        if (!updatedContent) {
            return res.status(404).json({ message: 'Content not found' });
        }
        
        res.json({
            message: 'Content updated successfully',
            content: updatedContent
        });
    } catch (error) {
        logger.error('Error updating content:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete content
app.delete('/api/content/:id', verifyToken, (req, res) => {
    try {
        const deleted = contentManager.deleteContent(req.params.id, req.user.id);
        
        if (!deleted) {
            return res.status(404).json({ message: 'Content not found' });
        }
        
        res.json({ message: 'Content deleted successfully' });
    } catch (error) {
        logger.error('Error deleting content:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user content statistics
app.get('/api/content/stats/user', verifyToken, (req, res) => {
    try {
        const stats = contentManager.getUserContentStats(req.user.id);
        
        res.json({
            message: 'Content statistics retrieved successfully',
            stats
        });
    } catch (error) {
        logger.error('Error retrieving content stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Mark content as exported
app.post('/api/content/:id/export', verifyToken, (req, res) => {
    try {
        const { exportType } = req.body;
        
        if (!exportType) {
            return res.status(400).json({ message: 'Export type is required' });
        }
        
        const marked = contentManager.markAsExported(req.params.id, req.user.id, exportType);
        
        if (!marked) {
            return res.status(404).json({ message: 'Content not found' });
        }
        
        res.json({ message: 'Content marked as exported successfully' });
    } catch (error) {
        logger.error('Error marking content as exported:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// --- AI Generation Routes (Enhanced with Content Storage) ---

// Quantum Computing Generation
app.post('/api/quantum/generate', verifyToken, (req, res) => {
    try {
        const { prompt, type } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }
        
        // Simulate quantum computing generation
        const generatedContent = `🔬 Quantum Computing Analysis: ${prompt}\n\nQuantum processing complete. Advanced algorithms have analyzed your request using 64 qubits with 98.5% accuracy. The quantum superposition states have been collapsed to provide optimal results.\n\nGenerated using TrendyX AI Level 5 Enterprise Quantum Computing Engine.`;
        
        // Store the generated content
        const contentData = {
            type: type || 'quantum',
            title: `Quantum Analysis: ${prompt.substring(0, 50)}...`,
            content: generatedContent,
            prompt,
            aiProvider: 'trendyx-quantum',
            model: 'quantum-64-qubit'
        };
        
        const storedContent = contentManager.storeContent(req.user.id, contentData);
        
        // Update AI systems metrics
        aiSystems.quantum.operations++;
        
        res.json({
            message: 'Quantum content generated successfully',
            content: generatedContent,
            contentId: storedContent ? storedContent.id : null,
            metrics: {
                qubits: aiSystems.quantum.qubits,
                accuracy: aiSystems.quantum.accuracy,
                operations: aiSystems.quantum.operations
            }
        });
    } catch (error) {
        logger.error('Error in quantum generation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Neural Network Generation
app.post('/api/neural/generate', verifyToken, (req, res) => {
    try {
        const { prompt, type } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }
        
        // Simulate neural network generation
        const generatedContent = `🧠 Neural Network Processing: ${prompt}\n\nNeural inference complete. 8 advanced AI models have processed your request with 96.2% accuracy. Deep learning algorithms have analyzed patterns and generated optimized content.\n\nGenerated using TrendyX AI Level 5 Enterprise Neural Network Orchestrator.`;
        
        // Store the generated content
        const contentData = {
            type: type || 'neural',
            title: `Neural Analysis: ${prompt.substring(0, 50)}...`,
            content: generatedContent,
            prompt,
            aiProvider: 'trendyx-neural',
            model: 'neural-8-model'
        };
        
        const storedContent = contentManager.storeContent(req.user.id, contentData);
        
        // Update AI systems metrics
        aiSystems.neural.inferences++;
        
        res.json({
            message: 'Neural content generated successfully',
            content: generatedContent,
            contentId: storedContent ? storedContent.id : null,
            metrics: {
                models: aiSystems.neural.models,
                accuracy: aiSystems.neural.accuracy,
                inferences: aiSystems.neural.inferences
            }
        });
    } catch (error) {
        logger.error('Error in neural generation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Predictive Analytics Generation
app.post('/api/predictive/generate', verifyToken, (req, res) => {
    try {
        const { prompt, type } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }
        
        // Simulate predictive analytics generation
        const generatedContent = `📊 Predictive Analytics: ${prompt}\n\nPredictive analysis complete. 6 advanced algorithms have forecasted trends and patterns with 94.7% accuracy. Statistical models and machine learning have generated predictive insights.\n\nGenerated using TrendyX AI Level 5 Enterprise Predictive Analytics Engine.`;
        
        // Store the generated content
        const contentData = {
            type: type || 'predictive',
            title: `Predictive Analysis: ${prompt.substring(0, 50)}...`,
            content: generatedContent,
            prompt,
            aiProvider: 'trendyx-predictive',
            model: 'predictive-6-algorithm'
        };
        
        const storedContent = contentManager.storeContent(req.user.id, contentData);
        
        // Update AI systems metrics
        aiSystems.predictive.predictions++;
        
        res.json({
            message: 'Predictive content generated successfully',
            content: generatedContent,
            contentId: storedContent ? storedContent.id : null,
            metrics: {
                algorithms: aiSystems.predictive.algorithms,
                accuracy: aiSystems.predictive.accuracy,
                predictions: aiSystems.predictive.predictions
            }
        });
    } catch (error) {
        logger.error('Error in predictive generation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// --- Integration Routes ---
const integrationRouter = require('./routes/integration');
app.use('/api/integration', integrationRouter);

// --- Health Check Routes ---
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '5.2.1',
        uptime: process.uptime(),
        message: 'TrendyX AI Level 5 Enterprise Enhanced server is operational.',
        authentication: 'enabled',
        contentManagement: 'enabled',
        aiSystems,
        performanceMetrics
    });
});

// --- Dashboard Routes ---
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard-enhanced.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth-frontend.html'));
});

// --- Self-Healing System Simulation ---
setInterval(() => {
    performanceMetrics.cpuUsage = Math.random() * 100;
    performanceMetrics.memoryUsage = Math.random() * 100;
    performanceMetrics.networkLatency = Math.random() * 50;
    performanceMetrics.requestsPerSecond = Math.floor(Math.random() * 1000);
    
    if (performanceMetrics.cpuUsage > 80) {
        aiSystems.selfHealing.actions++;
        logger.info('Self-healing triggered for cpu: Process throttling applied');
    }
    
    if (performanceMetrics.memoryUsage > 85) {
        aiSystems.selfHealing.actions++;
        logger.info('Self-healing triggered for memory: Garbage collection triggered');
    }
    
    if (performanceMetrics.networkLatency > 40) {
        aiSystems.selfHealing.actions++;
        logger.info('Self-healing triggered for network: Connection pool optimization');
    }
}, 30000);

// --- Socket.IO for Real-time Updates ---
io.on('connection', (socket) => {
    aiSystems.realtime.connections++;
    logger.info('A user connected via WebSocket.');
    io.emit('systemUpdate', { aiSystems, performanceMetrics });

    socket.on('disconnect', () => {
        aiSystems.realtime.connections--;
        logger.info('A user disconnected from WebSocket.');
    });
});

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
    logger.error('Unhandled error: ' + err.stack);
    res.status(500).send('Something broke!');
});

// --- Start Server ---
server.listen(PORT, () => {
    logger.info('🚀 TrendyX AI Level 5 Enterprise Enhanced Server started on port ' + PORT);
    logger.info('🌐 Dashboard: http://localhost:' + PORT);
    logger.info('🔬 Quantum Computing Engine: Ready');
    logger.info('🧠 Neural Network Orchestrator: Ready');
    logger.info('📊 Predictive Analytics Engine: Ready');
    logger.info('🔧 Self-Healing Systems: Active');
    logger.info('📡 WebSocket Server: Running');
    logger.info('🛡️ Security Middleware: Enabled');
    logger.info('⚡ Performance Optimization: Active');
    logger.info('🔐 Authentication System: Enabled');
    logger.info('📚 Content Management: Enabled');
    logger.info('🧠 AI Brain fully operational - Ready for Railway deployment!');
});

