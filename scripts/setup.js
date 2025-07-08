// ============================================================
// TRENDYX AI LEVEL 5 - SETUP SCRIPT
// This helps set up everything for our robot friends!
// ============================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Colors for pretty output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Helper functions
const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
    success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
    error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
    step: (msg) => console.log(`\n${colors.bright}${colors.cyan}📍 ${msg}${colors.reset}`)
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Main setup function
async function setup() {
    console.log(`
${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🚀 TRENDYX AI LEVEL 5 - AUTONOMOUS AI ECOSYSTEM      ║
║                                                              ║
║              Welcome to the Setup Wizard! 🧙‍♂️                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`);

    try {
        // Check Node.js version
        log.step('Checking system requirements...');
        checkNodeVersion();
        
        // Create directory structure
        log.step('Creating directory structure...');
        await createDirectoryStructure();
        
        // Check for existing configuration
        log.step('Checking configuration...');
        await checkConfiguration();
        
        // Install dependencies
        log.step('Installing dependencies...');
        await installDependencies();
        
        // Setup Redis (if needed)
        log.step('Checking Redis...');
        await checkRedis();
        
        // Initialize database
        log.step('Initializing database...');
        await initializeDatabase();
        
        // Configure environment
        log.step('Configuring environment...');
        await configureEnvironment();
        
        // Setup PM2 ecosystem
        log.step('Setting up PM2 ecosystem...');
        await setupPM2Ecosystem();
        
        // Run initial tests
        log.step('Running system checks...');
        await runSystemChecks();
        
        // Success!
        console.log(`
${colors.bright}${colors.green}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              🎉 SETUP COMPLETED SUCCESSFULLY! 🎉             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}

${colors.cyan}Next steps:${colors.reset}

1. ${colors.yellow}Configure your API keys in .env file:${colors.reset}
   - Add your OpenAI API key
   - Add your Anthropic API key (optional)

2. ${colors.yellow}Start the application:${colors.reset}
   
   ${colors.green}Development mode:${colors.reset}
   npm start
   
   ${colors.green}Production mode (with PM2):${colors.reset}
   npm run cluster
   
   ${colors.green}Monitor with PM2:${colors.reset}
   npm run monitor

3. ${colors.yellow}Access the dashboard:${colors.reset}
   http://localhost:3000

${colors.bright}${colors.magenta}Happy coding! 🚀${colors.reset}
`);

    } catch (error) {
        log.error(`Setup failed: ${error.message}`);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Check Node.js version
function checkNodeVersion() {
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.split('.')[0].substring(1));
    
    if (major < 18) {
        throw new Error(`Node.js 18+ required. You have ${nodeVersion}`);
    }
    
    log.success(`Node.js ${nodeVersion} ✓`);
    
    // Check npm version
    try {
        const npmVersion = execSync('npm -v', { encoding: 'utf8' }).trim();
        log.success(`npm ${npmVersion} ✓`);
    } catch (error) {
        log.warning('npm not found');
    }
}

// Create directory structure
async function createDirectoryStructure() {
    const directories = [
        'autonomous-systems',
        'neural-networks',
        'predictive-analytics',
        'real-time-engine',
        'orchestration',
        'self-healing',
        'quantum-core',
        'multi-cloud',
        'public',
        'public/css',
        'public/js',
        'scripts',
        'data',
        'logs',
        'uploads',
        'exports',
        'config'
    ];
    
    for (const dir of directories) {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            log.info(`Created ${dir}/`);
        } else {
            log.info(`${dir}/ already exists`);
        }
    }
    
    log.success('Directory structure created');
}

// Check for existing configuration
async function checkConfiguration() {
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
        log.warning('.env file not found');
        
        const createEnv = await question(`${colors.yellow}Create .env file from template? (y/n): ${colors.reset}`);
        
        if (createEnv.toLowerCase() === 'y') {
            const envTemplate = `# TrendyX AI Level 5 Configuration
# Copy this to .env and fill in your values

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Server
NODE_ENV=development
PORT=3000

# Security
JWT_SECRET=change_this_to_random_string_${Math.random().toString(36).substring(7)}
SESSION_SECRET=change_this_to_random_string_${Math.random().toString(36).substring(7)}

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Features
ENABLE_AUTONOMOUS_SYSTEMS=true
ENABLE_NEURAL_NETWORKS=true
ENABLE_PREDICTIVE_ANALYTICS=true
ENABLE_REALTIME_ENGINE=true
ENABLE_ORCHESTRATION=true
ENABLE_SELF_HEALING=true
ENABLE_QUANTUM_CORE=true
ENABLE_MULTI_CLOUD=true
`;
            
            fs.writeFileSync(envPath, envTemplate);
            log.success('.env file created - Please add your API keys!');
        }
    } else {
        log.success('.env file found');
    }
}

// Install dependencies
async function installDependencies() {
    const packagePath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packagePath)) {
        log.error('package.json not found!');
        throw new Error('Please ensure package.json exists in the project root');
    }
    
    const skipInstall = await question(`${colors.yellow}Install npm dependencies? This may take a few minutes (y/n): ${colors.reset}`);
    
    if (skipInstall.toLowerCase() === 'y') {
        log.info('Installing dependencies... (this may take a while)');
        
        try {
            execSync('npm install', { stdio: 'inherit' });
            log.success('Dependencies installed');
        } catch (error) {
            log.error('Failed to install dependencies');
            throw error;
        }
    } else {
        log.warning('Skipping dependency installation');
    }
}

// Check Redis
async function checkRedis() {
    try {
        execSync('redis-cli ping', { encoding: 'utf8' });
        log.success('Redis is running');
    } catch (error) {
        log.warning('Redis not found or not running');
        log.info('Redis is optional but recommended for production');
        
        const installRedis = await question(`${colors.yellow}Would you like instructions to install Redis? (y/n): ${colors.reset}`);
        
        if (installRedis.toLowerCase() === 'y') {
            console.log(`
${colors.cyan}Redis Installation:${colors.reset}

${colors.green}macOS:${colors.reset}
  brew install redis
  brew services start redis

${colors.green}Ubuntu/Debian:${colors.reset}
  sudo apt update
  sudo apt install redis-server
  sudo systemctl start redis

${colors.green}Windows:${colors.reset}
  Download from: https://github.com/microsoftarchive/redis/releases
  Or use WSL2 with Ubuntu instructions

${colors.green}Docker:${colors.reset}
  docker run -d -p 6379:6379 redis
`);
        }
    }
}

// Initialize database
async function initializeDatabase() {
    const dbPath = path.join(process.cwd(), 'data', 'database.json');
    
    if (!fs.existsSync(dbPath)) {
        const initialDb = {
            version: '5.0.0',
            created: new Date().toISOString(),
            users: [],
            sessions: [],
            content: [],
            analytics: []
        };
        
        fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
        log.success('Database initialized');
    } else {
        log.success('Database already exists');
    }
}

// Configure environment
async function configureEnvironment() {
    // Create default configuration files
    const configs = [
        {
            name: 'features.json',
            path: path.join(process.cwd(), 'config', 'features.json'),
            content: {
                modules: {
                    contentEngine: { enabled: true, version: '1.0.0' },
                    neuralProcessor: { enabled: true, version: '1.0.0' },
                    predictiveAnalytics: { enabled: true, version: '1.0.0' },
                    realtimeEngine: { enabled: true, version: '1.0.0' },
                    orchestrator: { enabled: true, version: '1.0.0' },
                    selfHealer: { enabled: true, version: '1.0.0' },
                    quantumOptimizer: { enabled: true, version: '1.0.0' },
                    multiCloud: { enabled: true, version: '1.0.0' }
                },
                api: {
                    rateLimit: true,
                    authentication: true,
                    cors: true
                }
            }
        },
        {
            name: 'limits.json',
            path: path.join(process.cwd(), 'config', 'limits.json'),
            content: {
                requests: {
                    perMinute: 100,
                    perHour: 1000,
                    perDay: 10000
                },
                storage: {
                    maxFileSize: 10485760,
                    maxTotalSize: 1073741824
                },
                processing: {
                    maxQueueSize: 1000,
                    timeoutSeconds: 300
                }
            }
        }
    ];
    
    for (const config of configs) {
        if (!fs.existsSync(config.path)) {
            fs.writeFileSync(config.path, JSON.stringify(config.content, null, 2));
            log.info(`Created ${config.name}`);
        }
    }
    
    log.success('Configuration files created');
}

// Setup PM2 ecosystem
async function setupPM2Ecosystem() {
    const ecosystemPath = path.join(process.cwd(), 'ecosystem.config.js');
    
    if (!fs.existsSync(ecosystemPath)) {
        const ecosystemConfig = `module.exports = {
  apps: [{
    name: 'trendyx-ai-level5',
    script: './server.js',
    instances: process.env.CLUSTER_WORKERS || 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'data', 'uploads', 'exports'],
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
`;
        
        fs.writeFileSync(ecosystemPath, ecosystemConfig);
        log.success('PM2 ecosystem configuration created');
    } else {
        log.success('PM2 ecosystem configuration exists');
    }
}

// Run system checks
async function runSystemChecks() {
    log.info('Running system diagnostics...');
    
    // Check available modules
    const modulePaths = [
        'autonomous-systems/content-engine.js',
        'neural-networks/processor.js',
        'predictive-analytics/analyzer.js',
        'real-time-engine/processor.js',
        'orchestration/manager.js',
        'self-healing/monitor.js',
        'quantum-core/optimizer.js',
        'multi-cloud/distributor.js'
    ];
    
    let missingModules = [];
    
    for (const modulePath of modulePaths) {
        if (!fs.existsSync(path.join(process.cwd(), modulePath))) {
            missingModules.push(modulePath);
        }
    }
    
    if (missingModules.length > 0) {
        log.warning(`Missing modules: ${missingModules.join(', ')}`);
        log.info('Please ensure all module files are created');
    } else {
        log.success('All AI modules found');
    }
    
    // Check server file
    if (!fs.existsSync(path.join(process.cwd(), 'server.js'))) {
        log.error('server.js not found!');
    } else {
        log.success('Main server file found');
    }
    
    // Check public files
    if (!fs.existsSync(path.join(process.cwd(), 'public', 'index.html'))) {
        log.warning('Dashboard (public/index.html) not found');
    } else {
        log.success('Dashboard found');
    }
    
    log.success('System checks completed');
}

// Run setup
setup().catch(error => {
    console.error(`${colors.red}Setup failed:${colors.reset}`, error);
    process.exit(1);
});