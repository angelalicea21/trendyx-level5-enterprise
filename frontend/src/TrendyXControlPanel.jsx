// TrendyXControlPanel.jsx
// SAVE THIS FILE IN: H:\TrendyX-Level5-Enterprise\frontend\src\TrendyXControlPanel.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';

// Advanced Configuration
const CONFIG = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  WS_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
  QUANTUM_STREAM_URL: process.env.REACT_APP_QUANTUM_URL || 'ws://localhost:3001/quantum-stream',
  POLLING_INTERVAL: 1000, // 1 second
  MAX_RETRIES: 3,
  QUANTUM_ENTANGLEMENT_THRESHOLD: 0.85
};

// Custom Hooks for AI Operations
const useAIService = () => {
  const [token, setToken] = useState(localStorage.getItem('trendyx_token'));
  const [connected, setConnected] = useState(false);
  const [quantumEntangled, setQuantumEntangled] = useState(false);
  const wsRef = useRef(null);
  const quantumWsRef = useRef(null);
  const retriesRef = useRef(0);

  // Setup Axios interceptors
  useEffect(() => {
    axios.defaults.baseURL = CONFIG.API_URL;
    
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && retriesRef.current < CONFIG.MAX_RETRIES) {
          retriesRef.current++;
          // Try to refresh token
          const newToken = await refreshToken();
          if (newToken) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return axios(error.config);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  // WebSocket connections
  useEffect(() => {
    if (token) {
      connectWebSockets();
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (quantumWsRef.current) quantumWsRef.current.close();
    };
  }, [token]);

  const connectWebSockets = () => {
    // Standard WebSocket
    wsRef.current = new WebSocket(CONFIG.WS_URL);
    
    wsRef.current.onopen = () => {
      console.log('Connected to AI WebSocket');
      setConnected(true);
      wsRef.current.send(JSON.stringify({
        type: 'authenticate',
        token
      }));
    };

    wsRef.current.onclose = () => {
      setConnected(false);
      // Reconnect after delay
      setTimeout(connectWebSockets, 5000);
    };

    // Quantum WebSocket
    quantumWsRef.current = new WebSocket(CONFIG.QUANTUM_STREAM_URL);
    
    quantumWsRef.current.onopen = () => {
      console.log('Connected to Quantum Stream');
      quantumWsRef.current.send(JSON.stringify({
        type: 'quantum-entangle'
      }));
    };

    quantumWsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'entangled') {
        setQuantumEntangled(true);
        console.log('Quantum entanglement established!');
      }
    };
  };

  const callAI = useCallback(async (endpoint, data, options = {}) => {
    try {
      const response = await axios.post(`/api/ai/${endpoint}`, data, options);
      return response.data;
    } catch (error) {
      console.error('AI call failed:', error);
      throw error;
    }
  }, []);

  const callQuantum = useCallback(async (operation, data) => {
    if (!quantumEntangled) {
      // Use REST API fallback
      const response = await axios.post(`/api/quantum/${operation}`, data);
      return response.data;
    }

    // Use quantum WebSocket for ultra-low latency
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Quantum timeout')), 5000);
      
      const handler = (event) => {
        const response = JSON.parse(event.data);
        if (response.type === 'quantum-result') {
          clearTimeout(timeout);
          quantumWsRef.current.removeEventListener('message', handler);
          resolve(response.result);
        }
      };

      quantumWsRef.current.addEventListener('message', handler);
      quantumWsRef.current.send(JSON.stringify({
        type: 'quantum-compute',
        payload: { operation, data }
      }));
    });
  }, [quantumEntangled]);

  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/auth/refresh');
      const newToken = response.data.token;
      setToken(newToken);
      localStorage.setItem('trendyx_token', newToken);
      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  };

  return {
    connected,
    quantumEntangled,
    callAI,
    callQuantum,
    token,
    setToken
  };
};

// Main TrendyX Control Panel Component
export default function TrendyXControlPanel() {
  const { connected, quantumEntangled, callAI, callQuantum, token, setToken } = useAIService();
  
  // State Management
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [aiMetrics, setAiMetrics] = useState(null);
  
  // Feature-specific states
  const [contentPrompt, setContentPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [predictionData, setPredictionData] = useState('');
  const [predictions, setPredictions] = useState(null);
  const [quantumProblem, setQuantumProblem] = useState('');
  const [quantumSolution, setQuantumSolution] = useState(null);
  const [neuralInput, setNeuralInput] = useState('');
  const [neuralAnalysis, setNeuralAnalysis] = useState(null);
  const [realtimeStreamId, setRealtimeStreamId] = useState(null);
  const [realtimeData, setRealtimeData] = useState([]);

  // Polling for system health
  useEffect(() => {
    if (connected) {
      const interval = setInterval(async () => {
        try {
          const health = await axios.get('/api/health');
          setSystemHealth(health.data);
        } catch (error) {
          console.error('Health check failed:', error);
        }
      }, CONFIG.POLLING_INTERVAL * 10); // Every 10 seconds

      return () => clearInterval(interval);
    }
  }, [connected]);

  // Authentication handlers
  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      localStorage.setItem('trendyx_token', newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email, username, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/register', { 
        email, 
        username, 
        password 
      });
      
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      localStorage.setItem('trendyx_token', newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // AI Feature Handlers
  const generateContent = async () => {
    if (!contentPrompt.trim()) return;
    
    setLoading(true);
    try {
      const result = await callAI('generate-content', {
        prompt: contentPrompt,
        style: 'advanced',
        length: 'optimal',
        keywords: extractKeywords(contentPrompt)
      });
      
      setGeneratedContent(result);
    } catch (error) {
      console.error('Content generation failed:', error);
      alert('Content generation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const makePrediction = async () => {
    if (!predictionData.trim()) return;
    
    setLoading(true);
    try {
      const data = JSON.parse(predictionData);
      const result = await callAI('predict', {
        data: data.values || data,
        horizon: data.horizon || '7d',
        features: ['trend', 'seasonality', 'anomalies', 'confidence']
      });
      
      setPredictions(result);
    } catch (error) {
      console.error('Prediction failed:', error);
      alert('Prediction failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const solveQuantumProblem = async () => {
    if (!quantumProblem.trim()) return;
    
    setLoading(true);
    try {
      const problem = JSON.parse(quantumProblem);
      const result = await callQuantum('optimize', problem);
      
      setQuantumSolution(result);
    } catch (error) {
      console.error('Quantum optimization failed:', error);
      alert('Quantum optimization failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithNeural = async () => {
    if (!neuralInput.trim()) return;
    
    setLoading(true);
    try {
      const result = await callAI('neural/analyze', {
        data: neuralInput,
        analysisType: 'comprehensive',
        models: ['mega-transformer', 'vision-quantum', 'multimodal-fusion']
      });
      
      setNeuralAnalysis(result);
    } catch (error) {
      console.error('Neural analysis failed:', error);
      alert('Neural analysis failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startRealtimeStream = async () => {
    try {
      const response = await callAI('realtime/stream/create', {
        streamType: 'multi-sensor',
        config: {
          latencyTarget: 10,
          bufferSize: 1000
        }
      });
      
      setRealtimeStreamId(response.streamId);
      
      // Start receiving real-time data
      // In a real implementation, this would use WebSocket
      const interval = setInterval(async () => {
        const data = {
          timestamp: new Date(),
          value: Math.random() * 100,
          prediction: Math.random() * 100 + 10,
          anomaly: Math.random() > 0.95
        };
        
        setRealtimeData(prev => [...prev.slice(-19), data]);
      }, 100); // 10Hz updates
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error('Failed to start real-time stream:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await axios.get('/api/metrics');
      setAiMetrics(response.data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  // Utility functions
  const extractKeywords = (text) => {
    // Simple keyword extraction
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an'];
    return words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 5);
  };

  // UI Components
  const StatusBar = () => (
    <div className="status-bar">
      <div className="status-item">
        <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
        <span>AI System: {connected ? 'Online' : 'Offline'}</span>
      </div>
      <div className="status-item">
        <span className={`status-dot ${quantumEntangled ? 'quantum' : 'classical'}`} />
        <span>Quantum: {quantumEntangled ? 'Entangled' : 'Classical'}</span>
      </div>
      {systemHealth && (
        <div className="status-item">
          <span className="status-dot healthy" />
          <span>Health: {systemHealth.status}</span>
        </div>
      )}
    </div>
  );

  const TabNavigation = () => (
    <div className="tab-navigation">
      {['dashboard', 'content', 'prediction', 'quantum', 'neural', 'realtime'].map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`tab-button ${activeTab === tab ? 'active' : ''}`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );

  const DashboardTab = () => (
    <div className="dashboard-tab">
      <h2>AI System Dashboard</h2>
      
      {systemHealth && (
        <div className="system-health">
          <h3>System Status</h3>
          <div className="health-grid">
            {Object.entries(systemHealth.services.ai.components).map(([name, status]) => (
              <div key={name} className="health-card">
                <h4>{name}</h4>
                <div className={`health-status ${status.status}`}>
                  {status.status || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {aiMetrics && (
        <div className="metrics-section">
          <h3>Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-value">
                {aiMetrics.ai.performance.operationsProcessed}
              </span>
              <span className="metric-label">Operations Processed</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">
                {aiMetrics.ai.quantumState.advantage.toFixed(2)}x
              </span>
              <span className="metric-label">Quantum Advantage</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">
                {(aiMetrics.ai.neuralState.averageAccuracy * 100).toFixed(1)}%
              </span>
              <span className="metric-label">Neural Accuracy</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">
                {aiMetrics.ai.performance.throughput}
              </span>
              <span className="metric-label">Throughput (ops/sec)</span>
            </div>
          </div>
        </div>
      )}
      
      <button onClick={loadMetrics} className="btn-primary">
        Refresh Metrics
      </button>
    </div>
  );

  const ContentTab = () => (
    <div className="content-tab">
      <h2>AI Content Generation</h2>
      
      <div className="input-section">
        <label>Content Prompt</label>
        <textarea
          value={contentPrompt}
          onChange={(e) => setContentPrompt(e.target.value)}
          placeholder="Describe what content you want to generate..."
          rows="4"
          className="input-textarea"
        />
        
        <button 
          onClick={generateContent} 
          disabled={loading || !connected}
          className="btn-primary"
        >
          {loading ? 'Generating...' : 'Generate Content'}
        </button>
      </div>
      
      {generatedContent && (
        <div className="result-section">
          <h3>Generated Content</h3>
          <div className="content-result">
            <p>{generatedContent.content}</p>
            
            {generatedContent.metadata && (
              <div className="metadata">
                <h4>Metadata</h4>
                <ul>
                  <li>Confidence: {(generatedContent.metadata.confidence * 100).toFixed(1)}%</li>
                  <li>Processing Time: {generatedContent.metrics.processingTime}ms</li>
                  <li>Quantum Boost: {generatedContent.metrics.quantumAdvantage}x</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const PredictionTab = () => (
    <div className="prediction-tab">
      <h2>Predictive Analytics</h2>
      
      <div className="input-section">
        <label>Data for Prediction (JSON)</label>
        <textarea
          value={predictionData}
          onChange={(e) => setPredictionData(e.target.value)}
          placeholder='{"values": [100, 120, 115, 130, 145], "horizon": "7d"}'
          rows="6"
          className="input-textarea code"
        />
        
        <button 
          onClick={makePrediction} 
          disabled={loading || !connected}
          className="btn-primary"
        >
          {loading ? 'Analyzing...' : 'Make Prediction'}
        </button>
      </div>
      
      {predictions && (
        <div className="result-section">
          <h3>Prediction Results</h3>
          <div className="prediction-result">
            <h4>Forecast</h4>
            <div className="forecast-values">
              {predictions.predictions.map((value, idx) => (
                <div key={idx} className="forecast-item">
                  <span>Day {idx + 1}:</span>
                  <span>{value.toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="confidence">
              Overall Confidence: {(predictions.confidence * 100).toFixed(1)}%
            </div>
            
            {predictions.insights && (
              <div className="insights">
                <h4>Insights</h4>
                <ul>
                  {predictions.insights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const QuantumTab = () => (
    <div className="quantum-tab">
      <h2>Quantum Computing</h2>
      
      <div className="quantum-status">
        <p>Quantum State: {quantumEntangled ? '⚛️ Entangled' : '📡 Classical'}</p>
        {quantumEntangled && <p className="quantum-advantage">Ultra-low latency mode active!</p>}
      </div>
      
      <div className="input-section">
        <label>Quantum Optimization Problem (JSON)</label>
        <textarea
          value={quantumProblem}
          onChange={(e) => setQuantumProblem(e.target.value)}
          placeholder='{"problem": "traveling-salesman", "cities": 10, "constraints": {...}}'
          rows="8"
          className="input-textarea code"
        />
        
        <button 
          onClick={solveQuantumProblem} 
          disabled={loading || !connected}
          className="btn-quantum"
        >
          {loading ? 'Quantum Processing...' : 'Solve with Quantum'}
        </button>
      </div>
      
      {quantumSolution && (
        <div className="result-section">
          <h3>Quantum Solution</h3>
          <div className="quantum-result">
            <div className="solution">
              <pre>{JSON.stringify(quantumSolution.solution, null, 2)}</pre>
            </div>
            
            <div className="quantum-metrics">
              <h4>Quantum Metrics</h4>
              <ul>
                <li>Quantum Advantage: {quantumSolution.quantumAdvantage}x</li>
                <li>Qubits Used: {quantumSolution.metadata.qubitsUsed}</li>
                <li>Gates Applied: {quantumSolution.metadata.gatesApplied}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const NeuralTab = () => (
    <div className="neural-tab">
      <h2>Neural Network Analysis</h2>
      
      <div className="input-section">
        <label>Input for Neural Analysis</label>
        <textarea
          value={neuralInput}
          onChange={(e) => setNeuralInput(e.target.value)}
          placeholder="Enter text, data, or description for neural network analysis..."
          rows="6"
          className="input-textarea"
        />
        
        <button 
          onClick={analyzeWithNeural} 
          disabled={loading || !connected}
          className="btn-primary"
        >
          {loading ? 'Analyzing...' : 'Analyze with Neural Networks'}
        </button>
      </div>
      
      {neuralAnalysis && (
        <div className="result-section">
          <h3>Neural Analysis Results</h3>
          <div className="neural-result">
            <div className="analysis">
              <h4>Analysis</h4>
              <pre>{JSON.stringify(neuralAnalysis.analysis, null, 2)}</pre>
            </div>
            
            <div className="insights">
              <h4>Neural Insights</h4>
              <ul>
                {neuralAnalysis.insights.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
            
            <div className="confidence">
              Neural Confidence: {(neuralAnalysis.confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const RealtimeTab = () => (
    <div className="realtime-tab">
      <h2>Real-Time Processing</h2>
      
      {!realtimeStreamId ? (
        <button 
          onClick={startRealtimeStream}
          className="btn-primary"
        >
          Start Real-Time Stream
        </button>
      ) : (
        <div className="realtime-content">
          <p>Stream ID: {realtimeStreamId}</p>
          
          <div className="realtime-data">
            <h3>Live Data Stream</h3>
            <div className="data-stream">
              {realtimeData.map((data, idx) => (
                <div key={idx} className={`data-point ${data.anomaly ? 'anomaly' : ''}`}>
                  <span>{new Date(data.timestamp).toLocaleTimeString()}</span>
                  <span>Value: {data.value.toFixed(2)}</span>
                  <span>Prediction: {data.prediction.toFixed(2)}</span>
                  {data.anomaly && <span className="anomaly-tag">ANOMALY</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Authentication UI
  if (!token) {
    return <AuthenticationForm onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // Main UI
  return (
    <div className="trendyx-control-panel">
      <header className="header">
        <h1>TrendyX Level 5 Enterprise Control Panel</h1>
        <StatusBar />
      </header>
      
      <TabNavigation />
      
      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'content' && <ContentTab />}
        {activeTab === 'prediction' && <PredictionTab />}
        {activeTab === 'quantum' && <QuantumTab />}
        {activeTab === 'neural' && <NeuralTab />}
        {activeTab === 'realtime' && <RealtimeTab />}
      </main>
      
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Processing with Advanced AI...</p>
        </div>
      )}
    </div>
  );
}

// Authentication Form Component
function AuthenticationForm({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = mode === 'login' 
      ? await onLogin(email, password)
      : await onRegister(email, username, password);

    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>TrendyX Level 5 Enterprise</h1>
        <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
          
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input-field"
            />
          )}
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="link-button"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}