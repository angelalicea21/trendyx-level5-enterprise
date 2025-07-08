// test-system.js
// SAVE THIS FILE IN: H:\TrendyX-Level5-Enterprise\test-system.js

const axios = require('axios');
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║            TRENDYX LEVEL 5 SYSTEM TEST SUITE                  ║
║                                                               ║
║              Testing All AI Components...                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
`);

const API_URL = 'http://localhost:3001';
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test user credentials
const testUser = {
  email: `test-${Date.now()}@trendyx.ai`,
  username: `testuser-${Date.now()}`,
  password: 'QuantumTest123!'
};

let authToken = null;

// Helper function to run tests
async function runTest(name, testFn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    const result = await testFn();
    console.log(`${colors.green}✓ PASSED${colors.reset}`);
    testResults.passed++;
    testResults.tests.push({ name, status: 'passed', result });
    return result;
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name, status: 'failed', error: error.message });
    return null;
  }
}

// Test functions
async function testServerConnection() {
  const response = await axios.get(`${API_URL}/api/health`);
  if (response.data.status !== 'healthy') {
    throw new Error('Server not healthy');
  }
  return response.data;
}

async function testUserRegistration() {
  const response = await axios.post(`${API_URL}/api/auth/register`, testUser);
  if (!response.data.token) {
    throw new Error('No token received');
  }
  authToken = response.data.token;
  return response.data;
}

async function testUserLogin() {
  const response = await axios.post(`${API_URL}/api/auth/login`, {
    email: testUser.email,
    password: testUser.password
  });
  if (!response.data.token) {
    throw new Error('Login failed');
  }
  authToken = response.data.token;
  return response.data;
}

async function testContentGeneration() {
  const response = await axios.post(
    `${API_URL}/api/ai/generate-content`,
    {
      prompt: 'Write a haiku about quantum computing',
      style: 'creative',
      length: 'short'
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  if (!response.data.content) {
    throw new Error('No content generated');
  }
  return response.data;
}

async function testPrediction() {
  const response = await axios.post(
    `${API_URL}/api/ai/predict`,
    {
      data: [100, 120, 115, 130, 145, 160, 155],
      horizon: '7d',
      features: ['trend', 'seasonality']
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  if (!response.data.predictions) {
    throw new Error('No predictions returned');
  }
  return response.data;
}

async function testQuantumOptimization() {
  const response = await axios.post(
    `${API_URL}/api/quantum/optimize`,
    {
      problem: {
        type: 'optimization',
        variables: 5,
        constraints: []
      },
      algorithm: 'vqe'
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  if (!response.data.solution) {
    throw new Error('No quantum solution returned');
  }
  return response.data;
}

async function testNeuralAnalysis() {
  const response = await axios.post(
    `${API_URL}/api/neural/analyze`,
    {
      data: 'The quantum computer processed information faster than classical systems.',
      analysisType: 'comprehensive'
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  if (!response.data.analysis) {
    throw new Error('No neural analysis returned');
  }
  return response.data;
}

async function testRealtimeStream() {
  const response = await axios.post(
    `${API_URL}/api/realtime/stream/create`,
    {
      streamType: 'test-stream',
      config: { latencyTarget: 10 }
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  if (!response.data.streamId) {
    throw new Error('No stream ID returned');
  }
  return response.data;
}

async function testSystemMetrics() {
  const response = await axios.get(
    `${API_URL}/api/metrics`,
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  if (!response.data.ai) {
    throw new Error('No metrics returned');
  }
  return response.data;
}

// Run all tests
async function runAllTests() {
  console.log(`\n${colors.bright}Starting System Tests...${colors.reset}\n`);

  // Basic connectivity
  console.log(`${colors.yellow}[1/9] Testing Basic Connectivity${colors.reset}`);
  const health = await runTest('Server Connection', testServerConnection);
  
  if (!health) {
    console.log(`\n${colors.red}Cannot connect to server! Is it running?${colors.reset}`);
    console.log('Run "StartTrendyX.bat" first, then try again.\n');
    return;
  }

  // Authentication
  console.log(`\n${colors.yellow}[2/9] Testing Authentication${colors.reset}`);
  await runTest('User Registration', testUserRegistration);
  await runTest('User Login', testUserLogin);

  if (!authToken) {
    console.log(`\n${colors.red}Authentication failed! Cannot continue tests.${colors.reset}\n`);
    return;
  }

  // AI Features
  console.log(`\n${colors.yellow}[3/9] Testing AI Features${colors.reset}`);
  const content = await runTest('Content Generation', testContentGeneration);
  
  console.log(`\n${colors.yellow}[4/9] Testing Predictive Analytics${colors.reset}`);
  const prediction = await runTest('Prediction Engine', testPrediction);
  
  console.log(`\n${colors.yellow}[5/9] Testing Quantum Computing${colors.reset}`);
  const quantum = await runTest('Quantum Optimization', testQuantumOptimization);
  
  console.log(`\n${colors.yellow}[6/9] Testing Neural Networks${colors.reset}`);
  const neural = await runTest('Neural Analysis', testNeuralAnalysis);
  
  console.log(`\n${colors.yellow}[7/9] Testing Real-time Processing${colors.reset}`);
  const realtime = await runTest('Real-time Stream', testRealtimeStream);
  
  console.log(`\n${colors.yellow}[8/9] Testing System Monitoring${colors.reset}`);
  const metrics = await runTest('System Metrics', testSystemMetrics);

  // Display results
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}TEST RESULTS SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  
  if (testResults.failed === 0) {
    console.log(`\n${colors.green}${colors.bright}🎉 ALL TESTS PASSED! Your TrendyX System is working perfectly!${colors.reset}`);
    
    // Show some sample results
    if (content) {
      console.log(`\n${colors.magenta}Sample Generated Content:${colors.reset}`);
      console.log(content.content);
    }
    
    if (prediction) {
      console.log(`\n${colors.magenta}Sample Prediction (Next 3 days):${colors.reset}`);
      console.log(prediction.predictions.slice(0, 3).map((p, i) => 
        `Day ${i + 1}: ${p.toFixed(2)}`
      ).join(', '));
    }
    
    if (quantum && quantum.quantumAdvantage) {
      console.log(`\n${colors.magenta}Quantum Advantage Achieved:${colors.reset} ${quantum.quantumAdvantage}x faster`);
    }
    
    if (metrics && metrics.ai) {
      console.log(`\n${colors.magenta}System Performance:${colors.reset}`);
      console.log(`- Operations Processed: ${metrics.ai.performance.operationsProcessed}`);
      console.log(`- Neural Networks: ${metrics.ai.neuralState.models} models loaded`);
      console.log(`- Quantum State: ${metrics.ai.quantumState.advantage.toFixed(2)}x advantage`);
    }
    
    console.log(`\n${colors.bright}${colors.blue}Your AI system is ready for production use! 🚀${colors.reset}\n`);
    
  } else {
    console.log(`\n${colors.red}Some tests failed. Please check the errors above.${colors.reset}`);
    console.log('\nCommon solutions:');
    console.log('1. Make sure MongoDB and Redis are running');
    console.log('2. Check that all npm packages installed correctly');
    console.log('3. Verify no other application is using port 3001');
    console.log('4. Check the logs folder for detailed error information\n');
  }
}

// Wait for server to be ready
async function waitForServer(retries = 30) {
  console.log('Waiting for server to be ready...');
  
  for (let i = 0; i < retries; i++) {
    try {
      await axios.get(`${API_URL}/api/health`);
      console.log(`${colors.green}Server is ready!${colors.reset}`);
      return true;
    } catch (error) {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`\n${colors.red}Server did not start in time.${colors.reset}`);
  return false;
}

// Main execution
async function main() {
  const serverReady = await waitForServer();
  
  if (serverReady) {
    await runAllTests();
  } else {
    console.log('\nPlease start the server first:');
    console.log('1. Run "StartTrendyX.bat" or "npm start"');
    console.log('2. Wait for "Server running on port 3001" message');
    console.log('3. Run this test again\n');
  }
}

// Run the tests
main().catch(error => {
  console.error(`\n${colors.red}Test suite error:${colors.reset}`, error.message);
  process.exit(1);
});