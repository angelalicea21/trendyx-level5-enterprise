require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const socketIO = require('socket.io');
const http = require('http');

// Import all your advanced AI modules
const QuantumEngine = require('./quantum-core/quantum_computing_engine');
const NeuralOrchestrator = require('./neural-networks/advanced_neural_orchestrator');
const PredictiveEngine = require('./predictive-analytics/predictive_failure_detector');
const HealingSystem = require('./self-healing/autonomous_healing_system');
const DecisionEngine = require('./autonomous-systems/autonomous_decision_engine');
const CloudManager = require('./multi-cloud/cloud_orchestration_manager');
const RealTimeEngine = require('./real-time-engine/real_time_processing_engine');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://trendyx-level5-6b5070635ee0.herokuapp.com']
            : ['http://localhost:3000', 'http://localhost:5000'],
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:", "https:"]
        }
    }
}));

app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// CRITICAL FIX: Properly serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize AI Systems
const quantumEngine = new QuantumEngine();
const neuralOrchestrator = new NeuralOrchestrator();
const predictiveEngine = new PredictiveEngine();
const healingSystem = new HealingSystem();
const decisionEngine = new DecisionEngine();
const cloudManager = new CloudManager();
const realTimeEngine = new RealTimeEngine();

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        systems: {
            quantum: quantumEngine.getStatus(),
            neural: neuralOrchestrator.getStatus(),
            predictive: predictiveEngine.getStatus(),
            healing: healingSystem.getStatus(),
            decision: decisionEngine.getStatus(),
            cloud: cloudManager.getStatus(),
            realtime: realTimeEngine.getStatus()
        },
        version: '5.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// AI API Routes
app.post('/api/quantum/optimize', async (req, res) => {
    try {
        const result = await quantumEngine.optimizeQuantum(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/neural/process', async (req, res) => {
    try {
        const result = await neuralOrchestrator.processNeural(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/predict/analyze', async (req, res) => {
    try {
        const result = await predictiveEngine.analyzePredictions(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/heal/diagnose', async (req, res) => {
    try {
        const result = await healingSystem.diagnoseAndHeal(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/decide/autonomous', async (req, res) => {
    try {
        const result = await decisionEngine.makeDecision(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Real-time WebSocket connections
io.on('connection', (socket) => {
    console.log('New WebSocket connection:', socket.id);
    
    socket.on('subscribe-metrics', () => {
        const metricsInterval = setInterval(() => {
            socket.emit('metrics-update', {
                quantum: quantumEngine.getMetrics(),
                neural: neuralOrchestrator.getMetrics(),
                predictive: predictiveEngine.getMetrics(),
                healing: healingSystem.getMetrics(),
                decision: decisionEngine.getMetrics(),
                cloud: cloudManager.getMetrics(),
                realtime: realTimeEngine.getMetrics(),
                timestamp: new Date().toISOString()
            });
        }, 1000);
        
        socket.on('disconnect', () => {
            clearInterval(metricsInterval);
        });
    });
    
    socket.on('quantum-request', async (data) => {
        const result = await quantumEngine.processRealtime(data);
        socket.emit('quantum-response', result);
    });
    
    socket.on('neural-request', async (data) => {
        const result = await neuralOrchestrator.processRealtime(data);
        socket.emit('neural-response', result);
    });
});

// CRITICAL FIX: Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal server error',
            status: err.status || 500
        }
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 TrendyX AI Level 5 Enterprise Server running on port ${PORT}`);
    console.log(`🌐 Website: ${process.env.NODE_ENV === 'production' ? 'https://trendyx-level5-6b5070635ee0.herokuapp.com' : `http://localhost:${PORT}`}`);
    console.log(`🔧 Health Check: ${process.env.NODE_ENV === 'production' ? 'https://trendyx-level5-6b5070635ee0.herokuapp.com' : `http://localhost:${PORT}`}/api/health`);
    console.log(`⚡ Real-time metrics available via WebSocket`);
    console.log(`🧠 AI APIs ready for neural, quantum, prediction, and healing operations`);
});

module.exports = { app, server, io };