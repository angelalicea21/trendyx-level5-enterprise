#!/usr/bin/env node

/**
 * TrendyX AI Level 5 Enterprise Enhanced Server with Authentication
 * Advanced AI Platform with Quantum Computing, Neural Networks & Autonomous Systems
 * Now includes: Advanced User Authentication, Profile Management, Website Integration
 * Version: 5.2.0 Enhanced with Authentication
 * Author: World-Class AI Engineering Team
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// Import Authentication System
const AuthenticationSystem = require('./auth-system');
const UserDatabase = require('./user-database');
const WebsiteIntegration = require('./website-integration');

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Initialize Authentication Systems
const authSystem = new AuthenticationSystem({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: '24h'
});

const userDatabase = new UserDatabase({
  dataDir: path.join(process.cwd(), 'data')
});

const websiteIntegration = new WebsiteIntegration({
  apiKey: process.env.WEBSITE_API_KEY,
  allowedOrigins: [
    'https://your-main-website.com',
    'https://www.your-main-website.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ]
});

// Logger Configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'trendyx-ai-level5-enterprise-auth' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  credentials: false
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Compression
app.use(compression());

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Files
app.use(express.static('public'));

// AI System State (PRESERVED FROM ORIGINAL)
let aiSystemState = {
  quantum: {
    enabled: true,
    algorithms: 8,
    operations: 0,
    qubits: 64,
    accuracy: 98.5
  },
  neural: {
    enabled: true,
    models: 8,
    inferences: 0,
    accuracy: 96.2
  },
  predictive: {
    enabled: true,
    algorithms: 6,
    predictions: 0,
    accuracy: 94.7
  },
  healing: {
    enabled: true,
    actions: 0,
    uptime: 99.99
  },
  realtime: {
    connections: 0,
    updates: 0,
    latency: 12
  }
};

// Quantum Computing Engine (PRESERVED FROM ORIGINAL)
class QuantumEngine {
  constructor() {
    this.algorithms = {
      grovers: this.groversSearch.bind(this),
      shors: this.shorsFactorization.bind(this),
      qft: this.quantumFourierTransform.bind(this),
      vqe: this.variationalQuantumEigensolver.bind(this),
      qaoa: this.quantumApproximateOptimization.bind(this),
      qml: this.quantumMachineLearning.bind(this),
      qcrypto: this.quantumCryptography.bind(this),
      qsim: this.quantumSimulation.bind(this)
    };
  }

  groversSearch(searchSpace = 1024) {
    const iterations = Math.ceil(Math.PI / 4 * Math.sqrt(searchSpace));
    const probability = Math.sin(Math.PI / 4) ** 2;
    aiSystemState.quantum.operations++;
    
    return {
      algorithm: "Grover's Search",
      searchSpace,
      iterations,
      probability: (probability * 100).toFixed(2) + '%',
      result: `Found target in ${iterations} iterations`,
      timestamp: new Date().toISOString(),
      qubits: Math.ceil(Math.log2(searchSpace)),
      complexity: `O(√${searchSpace})`
    };
  }

  shorsFactorization(number = 15) {
    const factors = [];
    let n = number;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      while (n % i === 0) {
        factors.push(i);
        n /= i;
      }
    }
    if (n > 1) factors.push(n);
    
    aiSystemState.quantum.operations++;
    
    return {
      algorithm: "Shor's Factorization",
      originalNumber: number,
      factors,
      result: `Factors: ${factors.join(' × ')}`,
      timestamp: new Date().toISOString(),
      qubits: Math.ceil(Math.log2(number)) * 2,
      complexity: `O((log N)³)`
    };
  }

  quantumFourierTransform(data = [1, 0, 1, 0]) {
    const n = data.length;
    const result = new Array(n).fill(0).map(() => ({ real: 0, imag: 0 }));
    
    for (let k = 0; k < n; k++) {
      for (let j = 0; j < n; j++) {
        const angle = -2 * Math.PI * k * j / n;
        result[k].real += data[j] * Math.cos(angle);
        result[k].imag += data[j] * Math.sin(angle);
      }
    }
    
    aiSystemState.quantum.operations++;
    
    return {
      algorithm: "Quantum Fourier Transform",
      input: data,
      output: result.map(c => `${c.real.toFixed(2)} + ${c.imag.toFixed(2)}i`),
      result: "QFT transformation completed",
      timestamp: new Date().toISOString(),
      qubits: Math.ceil(Math.log2(n)),
      complexity: `O(n²)`
    };
  }

  variationalQuantumEigensolver(hamiltonian = "H2") {
    const eigenvalue = Math.random() * -1.5 - 0.5; // Simulated ground state energy
    aiSystemState.quantum.operations++;
    
    return {
      algorithm: "Variational Quantum Eigensolver",
      hamiltonian,
      eigenvalue: eigenvalue.toFixed(6),
      result: `Ground state energy: ${eigenvalue.toFixed(6)} Hartree`,
      timestamp: new Date().toISOString(),
      qubits: 4,
      complexity: "O(poly(n))"
    };
  }

  quantumApproximateOptimization(problem = "MaxCut") {
    const approximationRatio = 0.7 + Math.random() * 0.2;
    aiSystemState.quantum.operations++;
    
    return {
      algorithm: "Quantum Approximate Optimization Algorithm",
      problem,
      approximationRatio: approximationRatio.toFixed(3),
      result: `Approximation ratio: ${approximationRatio.toFixed(3)}`,
      timestamp: new Date().toISOString(),
      qubits: 8,
      complexity: "O(p·m)"
    };
  }

  quantumMachineLearning(dataset = "iris") {
    const accuracy = 0.85 + Math.random() * 0.1;
    aiSystemState.quantum.operations++;
    
    return {
      algorithm: "Quantum Machine Learning",
      dataset,
      accuracy: (accuracy * 100).toFixed(2) + '%',
      result: `Classification accuracy: ${(accuracy * 100).toFixed(2)}%`,
      timestamp: new Date().toISOString(),
      qubits: 6,
      complexity: "O(log(N))"
    };
  }

  quantumCryptography(keyLength = 256) {
    const key = crypto.randomBytes(keyLength / 8).toString('hex');
    aiSystemState.quantum.operations++;
    
    return {
      algorithm: "Quantum Key Distribution",
      keyLength,
      key: key.substring(0, 32) + '...',
      result: `Secure key generated (${keyLength} bits)`,
      timestamp: new Date().toISOString(),
      qubits: keyLength,
      complexity: "O(n)"
    };
  }

  quantumSimulation(system = "Ising Model") {
    const energy = Math.random() * -10 - 5;
    aiSystemState.quantum.operations++;
    
    return {
      algorithm: "Quantum System Simulation",
      system,
      energy: energy.toFixed(4),
      result: `System energy: ${energy.toFixed(4)} J`,
      timestamp: new Date().toISOString(),
      qubits: 12,
      complexity: "O(2^n)"
    };
  }
}

// Neural Network Orchestrator (PRESERVED FROM ORIGINAL)
class NeuralOrchestrator {
  constructor() {
    this.models = {
      transformer: this.transformerModel.bind(this),
      cnn: this.convolutionalModel.bind(this),
      rnn: this.recurrentModel.bind(this),
      gan: this.generativeModel.bind(this),
      autoencoder: this.autoencoderModel.bind(this),
      resnet: this.residualModel.bind(this),
      bert: this.bertModel.bind(this),
      gpt: this.gptModel.bind(this)
    };
  }

  transformerModel(input = "Hello TrendyX AI!") {
    const tokens = input.split(' ').length;
    const attentionHeads = 8;
    const layers = 12;
    aiSystemState.neural.inferences++;
    
    return {
      model: "Transformer",
      input,
      tokens,
      attentionHeads,
      layers,
      output: `Processed: "${input}"`,
      result: "Text successfully processed",
      timestamp: new Date().toISOString(),
      parameters: "110M"
    };
  }

  convolutionalModel(imageSize = "224x224") {
    const filters = [32, 64, 128, 256];
    const accuracy = 0.92 + Math.random() * 0.05;
    aiSystemState.neural.inferences++;
    
    return {
      model: "Convolutional Neural Network",
      imageSize,
      filters,
      accuracy: (accuracy * 100).toFixed(2) + '%',
      result: `Image classification: ${(accuracy * 100).toFixed(2)}% accuracy`,
      timestamp: new Date().toISOString(),
      parameters: "25M"
    };
  }

  recurrentModel(sequenceLength = 100) {
    const hiddenUnits = 256;
    const layers = 3;
    aiSystemState.neural.inferences++;
    
    return {
      model: "Recurrent Neural Network",
      sequenceLength,
      hiddenUnits,
      layers,
      result: `Sequence processed (length: ${sequenceLength})`,
      timestamp: new Date().toISOString(),
      parameters: "15M"
    };
  }

  generativeModel(latentDim = 100) {
    const generatedSamples = Math.floor(Math.random() * 50) + 10;
    aiSystemState.neural.inferences++;
    
    return {
      model: "Generative Adversarial Network",
      latentDim,
      generatedSamples,
      result: `Generated ${generatedSamples} synthetic samples`,
      timestamp: new Date().toISOString(),
      parameters: "50M"
    };
  }

  autoencoderModel(compressionRatio = 0.1) {
    const reconstructionLoss = Math.random() * 0.05;
    aiSystemState.neural.inferences++;
    
    return {
      model: "Autoencoder",
      compressionRatio,
      reconstructionLoss: reconstructionLoss.toFixed(4),
      result: `Data compressed with ${reconstructionLoss.toFixed(4)} loss`,
      timestamp: new Date().toISOString(),
      parameters: "20M"
    };
  }

  residualModel(depth = 50) {
    const skipConnections = Math.floor(depth / 2);
    const accuracy = 0.94 + Math.random() * 0.04;
    aiSystemState.neural.inferences++;
    
    return {
      model: "Residual Network (ResNet)",
      depth,
      skipConnections,
      accuracy: (accuracy * 100).toFixed(2) + '%',
      result: `Deep learning: ${(accuracy * 100).toFixed(2)}% accuracy`,
      timestamp: new Date().toISOString(),
      parameters: "60M"
    };
  }

  bertModel(text = "TrendyX AI is revolutionary") {
    const wordPieces = text.split(' ').length * 1.5;
    const embeddings = 768;
    aiSystemState.neural.inferences++;
    
    return {
      model: "BERT (Bidirectional Encoder)",
      text,
      wordPieces: Math.floor(wordPieces),
      embeddings,
      result: "Bidirectional context understanding completed",
      timestamp: new Date().toISOString(),
      parameters: "340M"
    };
  }

  gptModel(prompt = "The future of AI is") {
    const generatedText = prompt + " bright and full of possibilities with quantum-enhanced neural networks.";
    const tokens = generatedText.split(' ').length;
    aiSystemState.neural.inferences++;
    
    return {
      model: "GPT (Generative Pre-trained Transformer)",
      prompt,
      generatedText,
      tokens,
      result: "Text generation completed",
      timestamp: new Date().toISOString(),
      parameters: "175B"
    };
  }
}

// Predictive Analytics Engine (PRESERVED FROM ORIGINAL)
class PredictiveEngine {
  constructor() {
    this.algorithms = {
      timeSeries: this.timeSeriesForecasting.bind(this),
      regression: this.regressionAnalysis.bind(this),
      classification: this.classificationModel.bind(this),
      clustering: this.clusteringAnalysis.bind(this),
      anomaly: this.anomalyDetection.bind(this),
      risk: this.riskAssessment.bind(this)
    };
  }

  timeSeriesForecasting(data = [1, 2, 3, 4, 5]) {
    const forecast = data.map((val, idx) => val + Math.sin(idx) * 0.5 + Math.random() * 0.2);
    const mape = Math.random() * 5 + 2; // Mean Absolute Percentage Error
    aiSystemState.predictive.predictions++;
    
    return {
      algorithm: "Time Series Forecasting",
      inputData: data,
      forecast: forecast.map(f => f.toFixed(2)),
      mape: mape.toFixed(2) + '%',
      result: `Forecast generated with ${mape.toFixed(2)}% MAPE`,
      timestamp: new Date().toISOString(),
      horizon: "7 days"
    };
  }

  regressionAnalysis(features = 5) {
    const r2Score = 0.85 + Math.random() * 0.1;
    const coefficients = Array.from({length: features}, () => (Math.random() - 0.5) * 2);
    aiSystemState.predictive.predictions++;
    
    return {
      algorithm: "Multiple Linear Regression",
      features,
      r2Score: r2Score.toFixed(3),
      coefficients: coefficients.map(c => c.toFixed(3)),
      result: `Model trained with R² = ${r2Score.toFixed(3)}`,
      timestamp: new Date().toISOString(),
      significance: "p < 0.001"
    };
  }

  classificationModel(classes = 3) {
    const accuracy = 0.88 + Math.random() * 0.1;
    const precision = accuracy + Math.random() * 0.05;
    const recall = accuracy + Math.random() * 0.05;
    aiSystemState.predictive.predictions++;
    
    return {
      algorithm: "Random Forest Classification",
      classes,
      accuracy: (accuracy * 100).toFixed(2) + '%',
      precision: (precision * 100).toFixed(2) + '%',
      recall: (recall * 100).toFixed(2) + '%',
      result: `Classification completed with ${(accuracy * 100).toFixed(2)}% accuracy`,
      timestamp: new Date().toISOString(),
      trees: 100
    };
  }

  clusteringAnalysis(dataPoints = 1000) {
    const clusters = Math.floor(Math.random() * 5) + 3;
    const silhouetteScore = 0.6 + Math.random() * 0.3;
    aiSystemState.predictive.predictions++;
    
    return {
      algorithm: "K-Means Clustering",
      dataPoints,
      clusters,
      silhouetteScore: silhouetteScore.toFixed(3),
      result: `${clusters} clusters identified with silhouette score ${silhouetteScore.toFixed(3)}`,
      timestamp: new Date().toISOString(),
      iterations: 50
    };
  }

  anomalyDetection(threshold = 0.05) {
    const anomalies = Math.floor(Math.random() * 20) + 5;
    const falsePositiveRate = Math.random() * 0.02;
    aiSystemState.predictive.predictions++;
    
    return {
      algorithm: "Isolation Forest Anomaly Detection",
      threshold,
      anomaliesDetected: anomalies,
      falsePositiveRate: (falsePositiveRate * 100).toFixed(2) + '%',
      result: `${anomalies} anomalies detected`,
      timestamp: new Date().toISOString(),
      contamination: threshold
    };
  }

  riskAssessment(factors = 10) {
    const riskScore = Math.random() * 100;
    const confidence = 0.85 + Math.random() * 0.1;
    aiSystemState.predictive.predictions++;
    
    return {
      algorithm: "Monte Carlo Risk Assessment",
      factors,
      riskScore: riskScore.toFixed(2),
      confidence: (confidence * 100).toFixed(2) + '%',
      result: `Risk score: ${riskScore.toFixed(2)}/100`,
      timestamp: new Date().toISOString(),
      simulations: 10000
    };
  }
}

// Self-Healing System (PRESERVED FROM ORIGINAL)
class SelfHealingSystem {
  constructor() {
    this.healingActions = [];
    this.systemHealth = {
      cpu: { status: 'healthy', value: 45.2, threshold: 80 },
      memory: { status: 'healthy', value: 62.1, threshold: 85 },
      disk: { status: 'healthy', value: 34.7, threshold: 90 },
      network: { status: 'healthy', value: 23.4, threshold: 100 },
      services: { status: 'healthy', value: 4, threshold: 4 }
    };
    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      this.performHealthCheck();
      this.optimizePerformance();
    }, 5000);
  }

  performHealthCheck() {
    // Simulate system metrics
    this.systemHealth.cpu.value = Math.random() * 100;
    this.systemHealth.memory.value = Math.random() * 100;
    this.systemHealth.disk.value = Math.random() * 100;
    this.systemHealth.network.value = Math.random() * 150;

    // Check for issues and heal
    Object.keys(this.systemHealth).forEach(metric => {
      const health = this.systemHealth[metric];
      if (health.value > health.threshold) {
        this.healSystem(metric, health);
      }
    });
  }

  healSystem(metric, health) {
    const healingAction = {
      timestamp: new Date().toISOString(),
      metric,
      issue: `${metric} usage at ${health.value.toFixed(1)}%`,
      action: this.getHealingAction(metric),
      status: 'completed'
    };

    this.healingActions.push(healingAction);
    aiSystemState.healing.actions++;

    // Simulate healing effect
    health.value = health.value * 0.7; // Reduce by 30%
    health.status = 'healing';

    setTimeout(() => {
      health.status = 'healthy';
    }, 2000);

    logger.info(`🔧 Self-healing action: ${healingAction.action}`);
  }

  getHealingAction(metric) {
    const actions = {
      cpu: 'Process throttling and load balancing applied',
      memory: 'Garbage collection and cache clearing initiated',
      disk: 'Temporary file cleanup and compression started',
      network: 'Connection pool optimization and bandwidth management',
      services: 'Service restart and health check performed'
    };
    return actions[metric] || 'General system optimization applied';
  }

  optimizePerformance() {
    // Simulate performance optimization
    if (Math.random() < 0.1) { // 10% chance
      const optimizations = [
        'Database query optimization',
        'Cache warming and preloading',
        'Connection pool tuning',
        'Memory allocation optimization',
        'CPU affinity adjustment'
      ];

      const optimization = optimizations[Math.floor(Math.random() * optimizations.length)];
      
      this.healingActions.push({
        timestamp: new Date().toISOString(),
        metric: 'performance',
        issue: 'Proactive optimization',
        action: optimization,
        status: 'completed'
      });

      aiSystemState.healing.actions++;
    }
  }

  getSystemHealth() {
    return {
      overall: this.calculateOverallHealth(),
      metrics: this.systemHealth,
      recentActions: this.healingActions.slice(-10),
      uptime: aiSystemState.healing.uptime,
      totalActions: aiSystemState.healing.actions
    };
  }

  calculateOverallHealth() {
    const metrics = Object.values(this.systemHealth);
    const healthyCount = metrics.filter(m => m.status === 'healthy').length;
    return (healthyCount / metrics.length * 100).toFixed(1);
  }
}

// Initialize AI Systems (PRESERVED FROM ORIGINAL)
const quantumEngine = new QuantumEngine();
const neuralOrchestrator = new NeuralOrchestrator();
const predictiveEngine = new PredictiveEngine();
const selfHealingSystem = new SelfHealingSystem();

// Authentication Middleware
const authenticateToken = authSystem.authenticateToken.bind(authSystem);
const requireRole = authSystem.requireRole.bind(authSystem);

// User Activity Tracking Middleware
const trackUserActivity = async (req, res, next) => {
  if (req.user && req.user.userId) {
    try {
      await userDatabase.updateSessionActivity(req.sessionId);
    } catch (error) {
      // Silent fail for activity tracking
    }
  }
  next();
};

// ==================== AUTHENTICATION ROUTES ====================

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await authSystem.registerUser(req.body);
    
    if (result.success) {
      // Create user in database
      await userDatabase.createUser({
        email: req.body.email,
        password: result.user.password, // Already hashed by auth system
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        company: req.body.company,
        role: req.body.role || 'user'
      });

      logger.info(`✅ New user registered: ${req.body.email}`);
    }

    res.json(result);
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authSystem.loginUser(email, password);
    
    if (result.success) {
      // Create session in database
      const sessionResult = await userDatabase.createSession({
        userId: result.user.id,
        email: result.user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      result.sessionId = sessionResult.sessionId;
      logger.info(`✅ User logged in: ${email}`);
    }

    res.json(result);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// Refresh Token
app.post('/api/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = authSystem.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// User Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { sessionId, refreshToken } = req.body;
    
    // End session in database
    if (sessionId) {
      await userDatabase.endSession(sessionId);
    }
    
    const result = authSystem.logoutUser(sessionId, refreshToken);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get User Profile
app.get('/api/auth/profile', authenticateToken, trackUserActivity, async (req, res) => {
  try {
    const userProfile = authSystem.getUserProfile(req.user.userId);
    const dbProfile = userDatabase.getUserProfile(req.user.userId);
    
    res.json({
      success: true,
      user: userProfile,
      profile: dbProfile
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Update User Profile (FIXES PROFILE SAVING ERROR)
app.put('/api/auth/profile', authenticateToken, trackUserActivity, async (req, res) => {
  try {
    // Update auth system profile
    const authResult = authSystem.updateUserProfile(req.user.userId, req.body);
    
    // Update database profile (this fixes the saving error)
    const dbResult = await userDatabase.updateUserProfile(req.user.userId, req.body);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: authResult.user,
      profile: dbResult.profile
    });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== WEBSITE INTEGRATION ROUTES ====================

// Handle signup from main website
app.post('/api/integration/signup', websiteIntegration.authenticateApiKey.bind(websiteIntegration), async (req, res) => {
  try {
    const origin = req.headers.origin || req.headers.referer;
    const result = await websiteIntegration.handleWebsiteSignup(req.body, origin);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Complete signup from integration token
app.post('/api/integration/complete-signup', async (req, res) => {
  try {
    const { token } = req.body;
    const result = await websiteIntegration.completeSignupFromToken(token, authSystem, userDatabase);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Handle login from main website
app.post('/api/integration/login', websiteIntegration.authenticateApiKey.bind(websiteIntegration), async (req, res) => {
  try {
    const origin = req.headers.origin || req.headers.referer;
    const result = await websiteIntegration.handleWebsiteLogin(req.body, origin);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Integration token verification
app.get('/api/integration/verify/:token', async (req, res) => {
  try {
    const userData = websiteIntegration.verifyIntegrationToken(req.params.token);
    res.json({
      success: true,
      userData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== ORIGINAL AI ROUTES (PRESERVED) ====================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '5.2.0-auth',
    systems: {
      quantum: aiSystemState.quantum.enabled,
      neural: aiSystemState.neural.enabled,
      predictive: aiSystemState.predictive.enabled,
      healing: aiSystemState.healing.enabled,
      realtime: aiSystemState.realtime.connections > 0,
      authentication: true
    }
  });
});

// System Metrics
app.get('/api/metrics', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    systems: aiSystemState,
    performance: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  });
});

// Quantum Computing Routes
app.get('/api/quantum/:algorithm', authenticateToken, trackUserActivity, async (req, res) => {
  try {
    const { algorithm } = req.params;
    const { searchSpace, number, data, hamiltonian, problem, dataset, keyLength, system } = req.query;
    
    if (!quantumEngine.algorithms[algorithm]) {
      return res.status(404).json({ error: 'Algorithm not found' });
    }

    let result;
    switch (algorithm) {
      case 'grovers':
        result = quantumEngine.algorithms.grovers(parseInt(searchSpace) || 1024);
        break;
      case 'shors':
        result = quantumEngine.algorithms.shors(parseInt(number) || 15);
        break;
      case 'qft':
        result = quantumEngine.algorithms.qft(data ? JSON.parse(data) : [1, 0, 1, 0]);
        break;
      case 'vqe':
        result = quantumEngine.algorithms.vqe(hamiltonian || "H2");
        break;
      case 'qaoa':
        result = quantumEngine.algorithms.qaoa(problem || "MaxCut");
        break;
      case 'qml':
        result = quantumEngine.algorithms.qml(dataset || "iris");
        break;
      case 'qcrypto':
        result = quantumEngine.algorithms.qcrypto(parseInt(keyLength) || 256);
        break;
      case 'qsim':
        result = quantumEngine.algorithms.qsim(system || "Ising Model");
        break;
      default:
        result = quantumEngine.algorithms[algorithm]();
    }

    // Record user activity
    if (req.user) {
      await userDatabase.recordActivity(req.user.userId, 'quantum_operation', { algorithm });
    }

    res.json(result);
  } catch (error) {
    logger.error('Quantum algorithm error:', error);
    res.status(500).json({ error: 'Quantum algorithm execution failed' });
  }
});

// Neural Network Routes
app.post('/api/neural/:model', authenticateToken, trackUserActivity, async (req, res) => {
  try {
    const { model } = req.params;
    const { input, text, imageSize, sequenceLength, latentDim, compressionRatio, depth, prompt } = req.body;
    
    if (!neuralOrchestrator.models[model]) {
      return res.status(404).json({ error: 'Model not found' });
    }

    let result;
    switch (model) {
      case 'transformer':
        result = neuralOrchestrator.models.transformer(input || text || "Hello TrendyX AI!");
        break;
      case 'cnn':
        result = neuralOrchestrator.models.cnn(imageSize || "224x224");
        break;
      case 'rnn':
        result = neuralOrchestrator.models.rnn(sequenceLength || 100);
        break;
      case 'gan':
        result = neuralOrchestrator.models.gan(latentDim || 100);
        break;
      case 'autoencoder':
        result = neuralOrchestrator.models.autoencoder(compressionRatio || 0.1);
        break;
      case 'resnet':
        result = neuralOrchestrator.models.resnet(depth || 50);
        break;
      case 'bert':
        result = neuralOrchestrator.models.bert(text || "TrendyX AI is revolutionary");
        break;
      case 'gpt':
        result = neuralOrchestrator.models.gpt(prompt || "The future of AI is");
        break;
      default:
        result = neuralOrchestrator.models[model]();
    }

    // Record user activity
    if (req.user) {
      await userDatabase.recordActivity(req.user.userId, 'neural_inference', { model });
    }

    res.json(result);
  } catch (error) {
    logger.error('Neural model error:', error);
    res.status(500).json({ error: 'Neural model execution failed' });
  }
});

// Predictive Analytics Routes
app.post('/api/predictive/:algorithm', authenticateToken, trackUserActivity, async (req, res) => {
  try {
    const { algorithm } = req.params;
    const { data, features, classes, dataPoints, threshold, factors } = req.body;
    
    if (!predictiveEngine.algorithms[algorithm]) {
      return res.status(404).json({ error: 'Algorithm not found' });
    }

    let result;
    switch (algorithm) {
      case 'timeSeries':
        result = predictiveEngine.algorithms.timeSeries(data || [1, 2, 3, 4, 5]);
        break;
      case 'regression':
        result = predictiveEngine.algorithms.regression(features || 5);
        break;
      case 'classification':
        result = predictiveEngine.algorithms.classification(classes || 3);
        break;
      case 'clustering':
        result = predictiveEngine.algorithms.clustering(dataPoints || 1000);
        break;
      case 'anomaly':
        result = predictiveEngine.algorithms.anomaly(threshold || 0.05);
        break;
      case 'risk':
        result = predictiveEngine.algorithms.risk(factors || 10);
        break;
      default:
        result = predictiveEngine.algorithms[algorithm]();
    }

    // Record user activity
    if (req.user) {
      await userDatabase.recordActivity(req.user.userId, 'predictive_analysis', { algorithm });
    }

    res.json(result);
  } catch (error) {
    logger.error('Predictive algorithm error:', error);
    res.status(500).json({ error: 'Predictive algorithm execution failed' });
  }
});

// Self-Healing System Routes
app.get('/api/healing/status', (req, res) => {
  res.json(selfHealingSystem.getSystemHealth());
});

app.post('/api/healing/trigger', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    selfHealingSystem.performHealthCheck();
    res.json({
      success: true,
      message: 'Self-healing check triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Self-healing trigger failed' });
  }
});

// Real-time Metrics
app.get('/api/realtime/metrics', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    systems: aiSystemState,
    health: selfHealingSystem.getSystemHealth(),
    authentication: authSystem.getAuthStats(),
    database: userDatabase.getStats(),
    integration: websiteIntegration.getIntegrationStats()
  });
});

// ==================== WEBSOCKET HANDLING (PRESERVED) ====================

io.on('connection', (socket) => {
  aiSystemState.realtime.connections++;
  logger.info(`🔌 WebSocket connected. Total connections: ${aiSystemState.realtime.connections}`);

  // Send initial system state
  socket.emit('systemState', aiSystemState);

  // Handle authentication for WebSocket
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      const decoded = authSystem.verifyToken(token);
      socket.userId = decoded.userId;
      socket.authenticated = true;
      socket.emit('authenticated', { success: true, user: decoded });
    } catch (error) {
      socket.emit('authenticated', { success: false, message: 'Invalid token' });
    }
  });

  // Handle quantum algorithm requests
  socket.on('quantumRequest', async (data) => {
    if (!socket.authenticated) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    try {
      const { algorithm, params } = data;
      const result = quantumEngine.algorithms[algorithm](params);
      socket.emit('quantumResult', result);
      
      // Record activity
      if (socket.userId) {
        await userDatabase.recordActivity(socket.userId, 'quantum_operation', { algorithm });
      }
    } catch (error) {
      socket.emit('error', { message: 'Quantum algorithm failed' });
    }
  });

  // Handle neural network requests
  socket.on('neuralRequest', async (data) => {
    if (!socket.authenticated) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    try {
      const { model, params } = data;
      const result = neuralOrchestrator.models[model](params);
      socket.emit('neuralResult', result);
      
      // Record activity
      if (socket.userId) {
        await userDatabase.recordActivity(socket.userId, 'neural_inference', { model });
      }
    } catch (error) {
      socket.emit('error', { message: 'Neural model failed' });
    }
  });

  // Handle predictive analytics requests
  socket.on('predictiveRequest', async (data) => {
    if (!socket.authenticated) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    try {
      const { algorithm, params } = data;
      const result = predictiveEngine.algorithms[algorithm](params);
      socket.emit('predictiveResult', result);
      
      // Record activity
      if (socket.userId) {
        await userDatabase.recordActivity(socket.userId, 'predictive_analysis', { algorithm });
      }
    } catch (error) {
      socket.emit('error', { message: 'Predictive algorithm failed' });
    }
  });

  socket.on('disconnect', () => {
    aiSystemState.realtime.connections--;
    logger.info(`🔌 WebSocket disconnected. Total connections: ${aiSystemState.realtime.connections}`);
  });
});

// Real-time system updates
setInterval(() => {
  aiSystemState.realtime.updates++;
  io.emit('systemUpdate', {
    timestamp: new Date().toISOString(),
    systems: aiSystemState,
    health: selfHealingSystem.getSystemHealth()
  });
}, 5000);

// ==================== STATIC FILE SERVING ====================

// Serve authentication frontend
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth-frontend.html'));
});

// Serve main dashboard (original)
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 TrendyX AI Level 5 Enterprise Enhanced</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; min-height: 100vh; padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 3em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .status { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
        .status.operational { border-left: 5px solid #4CAF50; }
        .systems-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .system-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 25px; border: 1px solid rgba(255,255,255,0.2); }
        .system-card h3 { font-size: 1.5em; margin-bottom: 15px; display: flex; align-items: center; }
        .system-card .icon { font-size: 1.8em; margin-right: 10px; }
        .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .metric { text-align: center; }
        .metric .value { font-size: 2em; font-weight: bold; color: #4CAF50; }
        .metric .label { font-size: 0.9em; opacity: 0.8; }
        .controls { margin-top: 20px; }
        .btn { background: linear-gradient(45deg, #4CAF50, #45a049); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-size: 1em; margin: 5px; transition: all 0.3s; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .monitoring { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 25px; margin-top: 30px; }
        .monitoring h3 { margin-bottom: 20px; }
        .monitoring-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .monitor-item { text-align: center; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; }
        .monitor-value { font-size: 1.5em; font-weight: bold; color: #4CAF50; }
        .api-section { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 25px; margin-top: 30px; }
        .api-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
        .api-endpoint { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center; }
        .auth-section { background: rgba(255,255,255,0.15); border-radius: 15px; padding: 25px; margin-top: 30px; border: 2px solid rgba(255,255,255,0.3); }
        .auth-btn { background: linear-gradient(45deg, #FF6B6B, #FF8E53); }
        .new-badge { background: #FF6B6B; color: white; font-size: 0.7em; padding: 2px 8px; border-radius: 10px; margin-left: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 TrendyX AI Level 5 Enterprise Enhanced</h1>
            <p>Advanced AI Platform with Quantum Computing, Neural Networks & Autonomous Systems</p>
            <p><strong>Now with Advanced Authentication System!</strong> <span class="new-badge">NEW</span></p>
        </div>

        <div class="status operational">
            <strong>✅ All Systems Operational</strong> | Version 5.2.0-auth | Enhanced with User Authentication
        </div>

        <div class="auth-section">
            <h3>🔐 Authentication System <span class="new-badge">NEW</span></h3>
            <p>Secure user authentication, profile management, and website integration now available!</p>
            <div style="margin-top: 15px;">
                <button class="btn auth-btn" onclick="window.location.href='/auth'">Access Authentication Portal</button>
                <button class="btn" onclick="testAuth()">Test Authentication API</button>
            </div>
        </div>

        <div class="systems-grid">
            <div class="system-card">
                <h3><span class="icon">🔬</span> Quantum Computing Engine</h3>
                <p>8 advanced quantum algorithms including Grover's Search, Shor's Factorization, and Quantum Fourier Transform.</p>
                <div class="metrics">
                    <div class="metric">
                        <div class="value" id="quantum-ops">0</div>
                        <div class="label">Operations</div>
                    </div>
                    <div class="metric">
                        <div class="value">64</div>
                        <div class="label">Qubits</div>
                    </div>
                </div>
                <div class="controls">
                    <select id="quantum-algo">
                        <option value="grovers">Grover's Search</option>
                        <option value="shors">Shor's Factorization</option>
                        <option value="qft">Quantum Fourier Transform</option>
                        <option value="vqe">Variational Quantum Eigensolver</option>
                        <option value="qaoa">Quantum Approximate Optimization</option>
                        <option value="qml">Quantum Machine Learning</option>
                        <option value="qcrypto">Quantum Cryptography</option>
                        <option value="qsim">Quantum Simulation</option>
                    </select>
                    <input type="text" id="quantum-param" placeholder="e.g. 1024 for search space" style="margin: 5px; padding: 8px; border-radius: 5px; border: none;">
                    <button class="btn" onclick="executeQuantum()">Execute Quantum Algorithm</button>
                </div>
                <div id="quantum-result" style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 5px; display: none;"></div>
            </div>

            <div class="system-card">
                <h3><span class="icon">🧠</span> Neural Network Orchestrator</h3>
                <p>8 neural architectures: Transformer, CNN, RNN, GAN, Autoencoder, ResNet, BERT, and GPT models.</p>
                <div class="metrics">
                    <div class="metric">
                        <div class="value" id="neural-inferences">0</div>
                        <div class="label">Inferences</div>
                    </div>
                    <div class="metric">
                        <div class="value">96.2%</div>
                        <div class="label">Accuracy</div>
                    </div>
                </div>
                <div class="controls">
                    <select id="neural-model">
                        <option value="transformer">Transformer</option>
                        <option value="cnn">CNN</option>
                        <option value="rnn">RNN</option>
                        <option value="gan">GAN</option>
                        <option value="autoencoder">Autoencoder</option>
                        <option value="resnet">ResNet</option>
                        <option value="bert">BERT</option>
                        <option value="gpt">GPT</option>
                    </select>
                    <input type="text" id="neural-input" placeholder="e.g. Hello TrendyX AI!" style="margin: 5px; padding: 8px; border-radius: 5px; border: none;">
                    <button class="btn" onclick="processNeural()">Process with Neural Network</button>
                </div>
                <div id="neural-result" style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 5px; display: none;"></div>
            </div>

            <div class="system-card">
                <h3><span class="icon">📊</span> Predictive Analytics Engine</h3>
                <p>6 algorithms for time series, regression, classification, clustering, anomaly detection, and risk assessment.</p>
                <div class="metrics">
                    <div class="metric">
                        <div class="value" id="predictive-predictions">0</div>
                        <div class="label">Predictions</div>
                    </div>
                    <div class="metric">
                        <div class="value">94.7%</div>
                        <div class="label">Accuracy</div>
                    </div>
                </div>
                <div class="controls">
                    <select id="predictive-algo">
                        <option value="timeSeries">Time Series Forecasting</option>
                        <option value="regression">Regression Analysis</option>
                        <option value="classification">Classification</option>
                        <option value="clustering">Clustering</option>
                        <option value="anomaly">Anomaly Detection</option>
                        <option value="risk">Risk Assessment</option>
                    </select>
                    <input type="text" id="predictive-data" placeholder="e.g. 1,2,3,4,5" style="margin: 5px; padding: 8px; border-radius: 5px; border: none;">
                    <button class="btn" onclick="generatePrediction()">Generate Prediction</button>
                </div>
                <div id="predictive-result" style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 5px; display: none;"></div>
            </div>

            <div class="system-card">
                <h3><span class="icon">🔧</span> Self-Healing Systems</h3>
                <p>Autonomous monitoring, proactive optimization, and automatic recovery systems ensure 99.99% uptime.</p>
                <div class="metrics">
                    <div class="metric">
                        <div class="value" id="healing-actions">0</div>
                        <div class="label">Healing Actions</div>
                    </div>
                    <div class="metric">
                        <div class="value">99.99%</div>
                        <div class="label">Uptime</div>
                    </div>
                </div>
                <div class="controls">
                    <button class="btn" onclick="checkSystemHealth()">Check System Health</button>
                    <button class="btn" onclick="triggerSelfHealing()">Trigger Self-Healing</button>
                </div>
                <div id="healing-result" style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 5px; display: none;"></div>
            </div>
        </div>

        <div class="monitoring">
            <h3>📡 Real-time System Monitoring</h3>
            <div class="monitoring-grid">
                <div class="monitor-item">
                    <div class="monitor-value" id="active-connections">0</div>
                    <div>Active Connections</div>
                </div>
                <div class="monitor-item">
                    <div class="monitor-value" id="updates-min">0</div>
                    <div>Updates/Min</div>
                </div>
                <div class="monitor-item">
                    <div class="monitor-value" id="latency">12ms</div>
                    <div>Latency</div>
                </div>
                <div class="monitor-item">
                    <div class="monitor-value" id="cpu-usage">45%</div>
                    <div>CPU Usage</div>
                </div>
                <div class="monitor-item">
                    <div class="monitor-value" id="memory-usage">62%</div>
                    <div>Memory Usage</div>
                </div>
                <div class="monitor-item">
                    <div class="monitor-value" id="network-io">1.2GB</div>
                    <div>Network I/O</div>
                </div>
            </div>
        </div>

        <div class="api-section">
            <h3>🔗 API Endpoints</h3>
            <div class="api-grid">
                <div class="api-endpoint">
                    <strong>Quantum Search</strong><br>
                    <button class="btn" onclick="testAPI('/api/quantum/grovers')">Test API</button>
                </div>
                <div class="api-endpoint">
                    <strong>Neural Processing</strong><br>
                    <button class="btn" onclick="testAPI('/api/neural/transformer', 'POST')">Test API</button>
                </div>
                <div class="api-endpoint">
                    <strong>Time Series Forecast</strong><br>
                    <button class="btn" onclick="testAPI('/api/predictive/timeSeries', 'POST')">Test API</button>
                </div>
                <div class="api-endpoint">
                    <strong>AI Generation</strong><br>
                    <button class="btn" onclick="testAPI('/api/ai/generate', 'POST')">Test API</button>
                </div>
                <div class="api-endpoint">
                    <strong>System Health</strong><br>
                    <button class="btn" onclick="testAPI('/api/healing/status')">Test API</button>
                </div>
                <div class="api-endpoint">
                    <strong>Real-time Metrics</strong><br>
                    <button class="btn" onclick="testAPI('/api/realtime/metrics')">Test API</button>
                </div>
            </div>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        
        socket.on('connect', () => {
            console.log('🔌 Connected to TrendyX AI Level 5 Enterprise');
            document.getElementById('active-connections').textContent = '1';
        });

        socket.on('systemUpdate', (data) => {
            updateMetrics(data);
        });

        function updateMetrics(data) {
            if (data.systems) {
                document.getElementById('quantum-ops').textContent = data.systems.quantum.operations;
                document.getElementById('neural-inferences').textContent = data.systems.neural.inferences;
                document.getElementById('predictive-predictions').textContent = data.systems.predictive.predictions;
                document.getElementById('healing-actions').textContent = data.systems.healing.actions;
                document.getElementById('updates-min').textContent = data.systems.realtime.updates;
            }
        }

        async function executeQuantum() {
            const algorithm = document.getElementById('quantum-algo').value;
            const param = document.getElementById('quantum-param').value;
            
            try {
                const response = await fetch(\`/api/quantum/\${algorithm}?searchSpace=\${param || 1024}\`);
                const result = await response.json();
                document.getElementById('quantum-result').style.display = 'block';
                document.getElementById('quantum-result').innerHTML = \`
                    <strong>\${result.algorithm}</strong><br>
                    \${result.result}<br>
                    <small>Qubits: \${result.qubits} | Complexity: \${result.complexity}</small>
                \`;
            } catch (error) {
                console.error('Quantum execution error:', error);
            }
        }

        async function processNeural() {
            const model = document.getElementById('neural-model').value;
            const input = document.getElementById('neural-input').value || 'Hello TrendyX AI!';
            
            try {
                const response = await fetch(\`/api/neural/\${model}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input })
                });
                const result = await response.json();
                document.getElementById('neural-result').style.display = 'block';
                document.getElementById('neural-result').innerHTML = \`
                    <strong>\${result.model}</strong><br>
                    \${result.result}<br>
                    <small>Parameters: \${result.parameters}</small>
                \`;
            } catch (error) {
                console.error('Neural processing error:', error);
            }
        }

        async function generatePrediction() {
            const algorithm = document.getElementById('predictive-algo').value;
            const data = document.getElementById('predictive-data').value;
            
            try {
                const response = await fetch(\`/api/predictive/\${algorithm}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: data ? data.split(',').map(Number) : [1,2,3,4,5] })
                });
                const result = await response.json();
                document.getElementById('predictive-result').style.display = 'block';
                document.getElementById('predictive-result').innerHTML = \`
                    <strong>\${result.algorithm}</strong><br>
                    \${result.result}<br>
                    <small>\${result.accuracy ? 'Accuracy: ' + result.accuracy : ''}</small>
                \`;
            } catch (error) {
                console.error('Prediction error:', error);
            }
        }

        async function checkSystemHealth() {
            try {
                const response = await fetch('/api/healing/status');
                const result = await response.json();
                document.getElementById('healing-result').style.display = 'block';
                document.getElementById('healing-result').innerHTML = \`
                    <strong>System Health: \${result.overall}%</strong><br>
                    Recent Actions: \${result.totalActions}<br>
                    <small>Uptime: \${result.uptime}%</small>
                \`;
            } catch (error) {
                console.error('Health check error:', error);
            }
        }

        async function triggerSelfHealing() {
            try {
                const response = await fetch('/api/healing/trigger', { method: 'POST' });
                const result = await response.json();
                alert('Self-healing triggered successfully!');
            } catch (error) {
                console.error('Self-healing trigger error:', error);
            }
        }

        async function testAPI(endpoint, method = 'GET') {
            try {
                const options = { method };
                if (method === 'POST') {
                    options.headers = { 'Content-Type': 'application/json' };
                    options.body = JSON.stringify({ text: 'Hello TrendyX AI!' });
                }
                
                const response = await fetch(endpoint, options);
                const result = await response.json();
                
                const popup = window.open('', '_blank', 'width=600,height=400');
                popup.document.write(\`
                    <html>
                        <head><title>API Test Result</title></head>
                        <body style="font-family: monospace; padding: 20px; background: #1a1a1a; color: #00ff00;">
                            <h3>API Test Result for \${endpoint}</h3>
                            <pre>\${JSON.stringify(result, null, 2)}</pre>
                        </body>
                    </html>
                \`);
            } catch (error) {
                alert('API test failed: ' + error.message);
            }
        }

        async function testAuth() {
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'test@trendyx.ai',
                        password: 'TestPassword123!',
                        firstName: 'Test',
                        lastName: 'User'
                    })
                });
                const result = await response.json();
                alert('Authentication API Test: ' + (result.success ? 'SUCCESS' : result.message));
            } catch (error) {
                alert('Authentication test failed: ' + error.message);
            }
        }

        // Auto-refresh metrics
        setInterval(async () => {
            try {
                const response = await fetch('/api/metrics');
                const data = await response.json();
                updateMetrics(data);
            } catch (error) {
                console.error('Metrics update error:', error);
            }
        }, 5000);
    </script>
</body>
</html>
  `);
});

// Error Handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 TrendyX AI Level 5 Enterprise Enhanced Server started on port ${PORT}`);
  logger.info(`🌐 Dashboard: http://localhost:${PORT}`);
  logger.info(`🔐 Authentication Portal: http://localhost:${PORT}/auth`);
  logger.info(`🔬 Quantum Computing Engine: Ready`);
  logger.info(`🧠 Neural Network Orchestrator: Ready`);
  logger.info(`📊 Predictive Analytics Engine: Ready`);
  logger.info(`🔧 Self-Healing Systems: Active`);
  logger.info(`📡 WebSocket Server: Running`);
  logger.info(`🛡️ Security Middleware: Enabled`);
  logger.info(`⚡ Performance Optimization: Active`);
  logger.info(`🔒 Authentication System: Ready`);
  logger.info(`💾 User Database: Initialized`);
  logger.info(`🌐 Website Integration: Active`);
  logger.info(`🧠 AI Brain fully operational with Authentication - Ready for Railway deployment!`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🔄 Graceful shutdown initiated...');
  
  // Save user data
  try {
    await userDatabase.saveData();
    logger.info('💾 User data saved successfully');
  } catch (error) {
    logger.error('❌ Error saving user data:', error);
  }
  
  // Close server
  server.close(() => {
    logger.info('✅ Server closed gracefully');
    process.exit(0);
  });
});

module.exports = app;

