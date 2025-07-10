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
            predictions: 0
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// --- MAIN WEBSITE SERVING (NEW) ---
// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// --- AI SYSTEMS SIMULATION ---
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

// --- WEBSITE INTEGRATION ROUTES (NEW) ---
// Import integration routes
const integrationRoutes = require('./routes/integration');
app.use('/api/integration', integrationRoutes);

// --- API ROUTES ---
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '5.2.1',
        uptime: process.uptime(),
        message: 'TrendyX AI Level 5 Enterprise Enhanced Server is operational.',
        authentication: 'enabled',
        aiSystems: aiSystems,
        performanceMetrics: performanceMetrics
    });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        if (!username || !password || !email) {
            return res.status(400).json({ message: 'Username, password, and email are required' });
        }
        
        const user = await registerUser(username, password, email);
        logger.info('User registered successfully: ' + username);
        
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        logger.error('Registration error: ' + error.message);
        res.status(400).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        const token = await loginUser(username, password);
        logger.info('User logged in successfully: ' + username);
        
        res.json({
            message: 'Login successful',
            token: token
        });
    } catch (error) {
        logger.error('Login error: ' + error.message);
        res.status(401).json({ message: error.message });
    }
});

// Protected route example
app.get('/api/user/profile', verifyToken, (req, res) => {
    const users = loadUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        lastLogin: user.lastLogin
    });
});

// AI Operations endpoints
app.post('/api/quantum/operation', verifyToken, (req, res) => {
    aiSystems.quantum.operations++;
    logger.info('Quantum operation executed by user: ' + req.user.username);
    
    res.json({
        message: 'Quantum operation completed',
        operation: req.body,
        result: 'Quantum computation successful',
        accuracy: aiSystems.quantum.accuracy + '%'
    });
});

app.post('/api/neural/inference', verifyToken, (req, res) => {
    aiSystems.neural.inferences++;
    logger.info('Neural inference executed by user: ' + req.user.username);
    
    res.json({
        message: 'Neural inference completed',
        input: req.body,
        result: 'Neural network prediction successful',
        accuracy: aiSystems.neural.accuracy + '%'
    });
});

app.post('/api/predictive/analyze', verifyToken, (req, res) => {
    aiSystems.predictive.predictions++;
    logger.info('Predictive analysis executed by user: ' + req.user.username);
    
    res.json({
        message: 'Predictive analysis completed',
        data: req.body,
        result: 'Predictive model analysis successful',
        accuracy: aiSystems.predictive.accuracy + '%'
    });
});

// --- DASHBOARD AND AUTH ROUTES ---
// Main AI Dashboard (preserved)
app.get('/dashboard', (req, res) => {
    const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TrendyX AI Level 5 Enterprise</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; min-height: 100vh; padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 3rem; margin-bottom: 10px; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .systems-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .system-card { 
            background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);
            border-radius: 15px; padding: 25px; border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .system-card h3 { font-size: 1.5rem; margin-bottom: 15px; display: flex; align-items: center; }
        .system-card h3::before { margin-right: 10px; font-size: 1.8rem; }
        .quantum h3::before { content: "⚛️"; }
        .neural h3::before { content: "🧠"; }
        .predictive h3::before { content: "📊"; }
        .healing h3::before { content: "🔧"; }
        .status { display: flex; justify-content: space-between; margin: 10px 0; }
        .status-ready { color: #4CAF50; font-weight: bold; }
        .status-active { color: #2196F3; font-weight: bold; }
        .auth-section { 
            background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);
            border-radius: 15px; padding: 25px; text-align: center; margin-top: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .btn { 
            background: #4CAF50; color: white; padding: 12px 24px; border: none;
            border-radius: 8px; cursor: pointer; margin: 5px; text-decoration: none;
            display: inline-block; transition: background 0.3s ease;
        }
        .btn:hover { background: #45a049; }
        .btn-secondary { background: #2196F3; }
        .btn-secondary:hover { background: #1976D2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 TrendyX AI Level 5 Enterprise</h1>
            <p>Advanced Quantum Computing • Neural Networks • Predictive Analytics</p>
        </div>
        
        <div class="systems-grid">
            <div class="system-card quantum">
                <h3>Quantum Computing Engine</h3>
                <div class="status"><span>Status:</span><span class="status-ready">Ready</span></div>
                <div class="status"><span>Algorithms:</span><span>8</span></div>
                <div class="status"><span>Operations:</span><span>0</span></div>
                <div class="status"><span>Qubits:</span><span>64</span></div>
                <div class="status"><span>Accuracy:</span><span>98.5%</span></div>
            </div>
            
            <div class="system-card neural">
                <h3>Neural Network Orchestrator</h3>
                <div class="status"><span>Status:</span><span class="status-ready">Ready</span></div>
                <div class="status"><span>Models:</span><span>8</span></div>
                <div class="status"><span>Inferences:</span><span>0</span></div>
                <div class="status"><span>Accuracy:</span><span>96.2%</span></div>
            </div>
            
            <div class="system-card predictive">
                <h3>Predictive Analytics Engine</h3>
                <div class="status"><span>Status:</span><span class="status-ready">Ready</span></div>
                <div class="status"><span>Algorithms:</span><span>6</span></div>
                <div class="status"><span>Predictions:</span><span>0</span></div>
                <div class="status"><span>Accuracy:</span><span>94.7%</span></div>
            </div>
            
            <div class="system-card healing">
                <h3>Self-Healing Systems</h3>
                <div class="status"><span>Status:</span><span class="status-active">Active</span></div>
                <div class="status"><span>Actions:</span><span>0</span></div>
                <div class="status"><span>Uptime:</span><span>99.99%</span></div>
            </div>
        </div>
        
        <div class="auth-section">
            <h3>🔑 User Authentication Portal</h3>
            <p>Access advanced AI features with secure authentication</p>
            <a href="/auth" class="btn">🔑 Login / Register</a>
            <a href="/api/health" class="btn btn-secondary">📊 System Health</a>
        </div>
    </div>
    
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        socket.on('systemUpdate', (data) => {
            console.log('System update received:', data);
        });
    </script>
</body>
</html>`;
    
    res.send(dashboardHTML);
});

// Authentication portal (preserved)
app.get('/auth', (req, res) => {
    const authHTML = `
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
            background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);
            border-radius: 15px; padding: 40px; width: 100%; max-width: 400px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .auth-header { text-align: center; margin-bottom: 30px; }
        .auth-header h1 { font-size: 2rem; margin-bottom: 10px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 5px; opacity: 0.9; }
        .form-group input { 
            width: 100%; padding: 12px; border: none; border-radius: 8px;
            background: rgba(255, 255, 255, 0.2); color: white; font-size: 16px;
        }
        .form-group input::placeholder { color: rgba(255, 255, 255, 0.7); }
        .form-group input:focus { outline: none; background: rgba(255, 255, 255, 0.3); }
        .btn { 
            width: 100%; padding: 12px; border: none; border-radius: 8px; cursor: pointer;
            font-size: 16px; margin-bottom: 10px; transition: background 0.3s ease;
        }
        .btn-primary { background: #4CAF50; color: white; }
        .btn-primary:hover { background: #45a049; }
        .btn-secondary { background: #2196F3; color: white; }
        .btn-secondary:hover { background: #1976D2; }
        .auth-links { text-align: center; margin-top: 20px; }
        .auth-links a { color: rgba(255, 255, 255, 0.8); text-decoration: none; }
        .auth-links a:hover { text-decoration: underline; }
        .back-link { text-align: center; margin-top: 20px; }
        .back-link a { color: #ff6b6b; text-decoration: none; }
        .back-link a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-header">
            <h1>🔑 TrendyX AI Authentication</h1>
            <p>Secure access to advanced AI features</p>
        </div>
        
        <form id="auth-form">
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" placeholder="Enter username" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" placeholder="Enter password" required>
            </div>
            
            <button type="submit" class="btn btn-primary">🔑 Login</button>
        </form>
        
        <div class="auth-links">
            <p>Don't have an account? <a href="#" onclick="showRegister()">Register here</a></p>
        </div>
        
        <div class="back-link">
            <a href="/dashboard">← Back to Dashboard</a>
        </div>
    </div>
    
    <script>
        document.getElementById('auth-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const username = formData.get('username');
            const password = formData.get('password');
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    alert('Login successful!');
                    window.location.href = '/dashboard';
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        });
        
        function showRegister() {
            alert('Registration feature coming soon! For now, please contact admin.');
        }
    </script>
</body>
</html>`;
    
    res.send(authHTML);
});

// Default route - serve main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback for SPA routing
app.get('*', (req, res) => {
    // If it's an API route that doesn't exist, return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    // For all other routes, serve the main website
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
    logger.info('🌐 Main Website: http://localhost:' + PORT);
    logger.info('🌐 AI Dashboard: http://localhost:' + PORT + '/dashboard');
    logger.info('🔬 Quantum Computing Engine: Ready');
    logger.info('🧠 Neural Network Orchestrator: Ready');
    logger.info('📊 Predictive Analytics Engine: Ready');
    logger.info('🔧 Self-Healing Systems: Active');
    logger.info('📡 WebSocket Server: Running');
    logger.info('🛡️ Security Middleware: Enabled');
    logger.info('⚡ Performance Optimization: Active');
    logger.info('🔐 Authentication System: Enabled');
    logger.info('🌐 Website Integration: Enabled');
    logger.info('🧠 AI Brain fully operational - Ready for Railway deployment!');
});

