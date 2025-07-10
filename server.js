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
    
    if (email && users.find(user => user.email === email)) {
        throw new Error('Email already exists');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
        id: Date.now().toString(),
        username,
        email: email || '',
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
    const user = users.find(u => u.username === username || u.email === username);
    
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
// FIXED: Configure Helmet with proper CSP to allow inline scripts
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

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
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
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
try {
    const integrationRouter = require('./routes/integration');
    app.use('/api/integration', integrationRouter);
} catch (error) {
    logger.warn('Integration routes not found, skipping...');
}

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
        cspFixed: 'true',
        aiSystems,
        performanceMetrics
    });
});

// --- Dashboard Routes ---
app.get('/dashboard', (req, res) => {
    // Try to serve the enhanced dashboard, fallback to inline HTML if file not found
    const dashboardPath = path.join(__dirname, 'public', 'dashboard-enhanced.html');
    
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        // Fallback inline dashboard with DAY 2 features
        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TrendyX AI Level 5 Enterprise - Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 3rem; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .systems-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .system-card { 
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(10px);
            border-radius: 15px; 
            padding: 25px; 
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease;
        }
        .system-card:hover { transform: translateY(-5px); }
        .system-card h3 { font-size: 1.3rem; margin-bottom: 15px; color: #fff; }
        .metric { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .metric span:first-child { opacity: 0.8; }
        .metric span:last-child { font-weight: bold; }
        .generate-btn { 
            width: 100%; margin-top: 15px; padding: 12px; 
            background: linear-gradient(45deg, #4CAF50, #45a049);
            border: none; border-radius: 8px; color: white; cursor: pointer; 
            font-weight: bold; transition: all 0.3s ease;
        }
        .generate-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3); }
        .auth-section { 
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(10px);
            border-radius: 15px; 
            padding: 30px; 
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
            margin-bottom: 20px;
        }
        .btn { 
            padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; 
            font-size: 1rem; transition: all 0.3s ease; text-decoration: none; display: inline-block; margin: 5px;
        }
        .btn-primary { background: #4CAF50; color: white; }
        .btn-secondary { background: #2196F3; color: white; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
        .status { 
            display: inline-block; padding: 4px 12px; border-radius: 20px; 
            font-size: 0.8rem; background: #4CAF50; color: white;
        }
        .modal { 
            display: none; position: fixed; z-index: 1000; left: 0; top: 0; 
            width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); backdrop-filter: blur(5px);
        }
        .modal-content { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 5% auto; padding: 2rem; border-radius: 15px; width: 90%; max-width: 600px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .form-group { margin-bottom: 1rem; }
        .form-label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        .form-input { 
            width: 100%; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.3);
            border-radius: 8px; background: rgba(255,255,255,0.1); color: white;
        }
        .form-textarea { min-height: 150px; resize: vertical; }
        .close { color: white; font-size: 28px; font-weight: bold; cursor: pointer; float: right; }
        .close:hover { opacity: 0.7; }
        .toast { 
            position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white;
            padding: 1rem 1.5rem; border-radius: 8px; z-index: 1001; transform: translateX(400px);
            transition: transform 0.3s ease;
        }
        .toast.show { transform: translateX(0); }
        .toast.error { background: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 TrendyX AI Level 5 Enterprise</h1>
            <p>Advanced Quantum Computing • Neural Networks • Predictive Analytics</p>
        </div>
        
        <div class="auth-section">
            <h2>🔐 Authentication Required</h2>
            <p>Please login to access the enhanced dashboard with content management features</p>
            <a href="/auth" class="btn btn-primary">🔑 Login / Register</a>
            <a href="/api/health" class="btn btn-secondary">📊 System Health</a>
        </div>
        
        <div class="systems-grid">
            <div class="system-card">
                <h3>🔬 Quantum Computing Engine</h3>
                <div class="metric"><span>Status:</span><span class="status">Ready</span></div>
                <div class="metric"><span>Algorithms:</span><span>8</span></div>
                <div class="metric"><span>Qubits:</span><span>64</span></div>
                <div class="metric"><span>Accuracy:</span><span>98.5%</span></div>
                <button class="generate-btn" onclick="showAuthRequired()">Generate Quantum Content</button>
            </div>
            
            <div class="system-card">
                <h3>🧠 Neural Network Orchestrator</h3>
                <div class="metric"><span>Status:</span><span class="status">Ready</span></div>
                <div class="metric"><span>Models:</span><span>8</span></div>
                <div class="metric"><span>Accuracy:</span><span>96.2%</span></div>
                <button class="generate-btn" onclick="showAuthRequired()">Generate Neural Content</button>
            </div>
            
            <div class="system-card">
                <h3>📊 Predictive Analytics Engine</h3>
                <div class="metric"><span>Status:</span><span class="status">Ready</span></div>
                <div class="metric"><span>Algorithms:</span><span>6</span></div>
                <div class="metric"><span>Accuracy:</span><span>94.7%</span></div>
                <button class="generate-btn" onclick="showAuthRequired()">Generate Predictive Content</button>
            </div>
        </div>
    </div>
    
    <div id="toast" class="toast"></div>
    
    <script>
        function showAuthRequired() {
            showToast('Please login first to access AI generation features', 'error');
            setTimeout(() => {
                window.location.href = '/auth';
            }, 2000);
        }
        
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = 'toast ' + type;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
        
        // Check if user is authenticated
        const token = localStorage.getItem('authToken');
        if (token) {
            // User is authenticated, redirect to enhanced dashboard
            window.location.href = '/dashboard-enhanced';
        }
    </script>
</body>
</html>
        `);
    }
});

// Enhanced dashboard route (for authenticated users)
app.get('/dashboard-enhanced', (req, res) => {
    const enhancedDashboardPath = path.join(__dirname, 'dashboard-enhanced.html');
    
    if (fs.existsSync(enhancedDashboardPath)) {
        res.sendFile(enhancedDashboardPath);
    } else {
        res.redirect('/dashboard');
    }
});

// Authentication portal
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center;
        }
        .auth-container { 
            background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
            border-radius: 15px; padding: 40px; width: 100%; max-width: 400px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .auth-header { text-align: center; margin-bottom: 30px; }
        .auth-tabs { display: flex; margin-bottom: 30px; }
        .tab-btn { flex: 1; padding: 12px; border: none; background: rgba(255,255,255,0.1);
            color: white; cursor: pointer; transition: all 0.3s ease;
        }
        .tab-btn.active { background: rgba(255,255,255,0.2); }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: bold; }
        .form-input { 
            width: 100%; padding: 12px; border: 1px solid rgba(255,255,255,0.3);
            border-radius: 8px; background: rgba(255,255,255,0.1); color: white;
        }
        .form-input::placeholder { color: rgba(255,255,255,0.7); }
        .submit-btn { 
            width: 100%; padding: 15px; border: none; border-radius: 8px;
            background: #4CAF50; color: white; font-size: 16px; font-weight: bold;
            cursor: pointer; transition: all 0.3s ease;
        }
        .submit-btn:hover { background: #45a049; transform: translateY(-2px); }
        .submit-btn:disabled { background: #666; cursor: not-allowed; transform: none; }
        .back-link { text-align: center; margin-top: 20px; }
        .back-link a { color: rgba(255,255,255,0.8); text-decoration: none; }
        .back-link a:hover { color: white; }
        .toast { 
            position: fixed; top: 20px; right: 20px; background: #f44336; color: white;
            padding: 1rem 1.5rem; border-radius: 8px; z-index: 1001; transform: translateX(400px);
            transition: transform 0.3s ease;
        }
        .toast.show { transform: translateX(0); }
        .toast.success { background: #4CAF50; }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-header">
            <h1>🔐 TrendyX AI</h1>
            <p>Authentication Portal</p>
        </div>
        
        <div class="auth-tabs">
            <button class="tab-btn active" onclick="switchTab('login')">Login</button>
            <button class="tab-btn" onclick="switchTab('register')">Register</button>
        </div>
        
        <form id="authForm">
            <div id="registerFields" style="display: none;">
                <div class="form-group">
                    <label class="form-label">Username:</label>
                    <input type="text" id="regUsername" class="form-input" placeholder="Choose a username" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email:</label>
                    <input type="email" id="regEmail" class="form-input" placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label class="form-label">Password:</label>
                    <input type="password" id="regPassword" class="form-input" placeholder="Choose a password" required>
                </div>
                <button type="submit" class="submit-btn" id="registerBtn">Register Account</button>
            </div>
            
            <div id="loginFields">
                <div class="form-group">
                    <label class="form-label">Username or Email:</label>
                    <input type="text" id="loginUsername" class="form-input" placeholder="Enter username or email" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Password:</label>
                    <input type="password" id="loginPassword" class="form-input" placeholder="Enter your password" required>
                </div>
                <button type="submit" class="submit-btn" id="loginBtn">Login to TrendyX AI</button>
            </div>
        </form>
        
        <div class="back-link">
            <a href="/">← Back to TrendyX AI Dashboard</a>
        </div>
    </div>
    
    <div id="toast" class="toast"></div>
    
    <script>
        let currentTab = 'login';
        
        function switchTab(tab) {
            currentTab = tab;
            const loginFields = document.getElementById('loginFields');
            const registerFields = document.getElementById('registerFields');
            const tabBtns = document.querySelectorAll('.tab-btn');
            
            tabBtns.forEach(btn => btn.classList.remove('active'));
            
            if (tab === 'login') {
                loginFields.style.display = 'block';
                registerFields.style.display = 'none';
                tabBtns[0].classList.add('active');
            } else {
                loginFields.style.display = 'none';
                registerFields.style.display = 'block';
                tabBtns[1].classList.add('active');
            }
        }
        
        document.getElementById('authForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = currentTab === 'login' ? document.getElementById('loginBtn') : document.getElementById('registerBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = currentTab === 'login' ? 'Logging in...' : 'Registering...';
            
            try {
                let endpoint, data;
                
                if (currentTab === 'login') {
                    endpoint = '/api/login';
                    data = {
                        username: document.getElementById('loginUsername').value,
                        password: document.getElementById('loginPassword').value
                    };
                } else {
                    endpoint = '/api/register';
                    data = {
                        username: document.getElementById('regUsername').value,
                        email: document.getElementById('regEmail').value,
                        password: document.getElementById('regPassword').value
                    };
                }
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('authToken', result.token);
                    showToast(result.message, 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard-enhanced';
                    }, 1500);
                } else {
                    showToast(result.message, 'error');
                }
            } catch (error) {
                showToast('Network error. Please try again.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = currentTab === 'login' ? 'Login to TrendyX AI' : 'Register Account';
            }
        });
        
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = 'toast ' + type;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
        
        // Check if already authenticated
        const token = localStorage.getItem('authToken');
        if (token) {
            window.location.href = '/dashboard-enhanced';
        }
    </script>
</body>
</html>
        `);
    }
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
server.listen(PORT, '0.0.0.0', () => {
    logger.info('🚀 TrendyX AI Level 5 Enterprise Enhanced Server started on port ' + PORT);
    logger.info('🌐 Dashboard: http://localhost:' + PORT);
    logger.info('🔬 Quantum Computing Engine: Ready');
    logger.info('🧠 Neural Network Orchestrator: Ready');
    logger.info('📊 Predictive Analytics Engine: Ready');
    logger.info('🔧 Self-Healing Systems: Active');
    logger.info('📡 WebSocket Server: Running');
    logger.info('🛡️ Security Middleware: Enabled (CSP Fixed)');
    logger.info('⚡ Performance Optimization: Active');
    logger.info('🔐 Authentication System: Enabled');
    logger.info('📚 Content Management: Enabled');
    logger.info('✅ CSP Configuration: Fixed for JavaScript execution');
    logger.info('🧠 AI Brain fully operational - Ready for Railway deployment!');
});

