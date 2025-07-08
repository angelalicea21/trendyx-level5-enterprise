// monitor-railway.js - Real-time monitoring for TrendyX on Railway
const axios = require('axios');
const chalk = require('chalk');

// Configuration
const APP_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : 'https://trendyx-level5-enterprise.railway.app';

console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════╗
║     TrendyX Level 5 - Railway Monitor v5.0       ║
║           Full Power Mode Activated              ║
╚══════════════════════════════════════════════════╝
`));

console.log(chalk.yellow(`Monitoring: ${APP_URL}`));
console.log(chalk.gray('Press Ctrl+C to stop monitoring\n'));

// Monitor function
async function checkHealth() {
    try {
        const response = await axios.get(`${APP_URL}/api/health`);
        const data = response.data;
        
        console.clear();
        console.log(chalk.cyan.bold('🚀 TrendyX Level 5 - System Status'));
        console.log(chalk.gray('─'.repeat(50)));
        
        // Status
        const statusColor = data.status === 'operational' ? chalk.green : chalk.red;
        console.log(`Status: ${statusColor.bold(data.status.toUpperCase())}`);
        console.log(`Platform: ${chalk.blue(data.platform)}`);
        console.log(`Uptime: ${chalk.white(formatUptime(data.uptime))}`);
        
        // Memory
        console.log(chalk.yellow.bold('\n💾 Memory Usage:'));
        const memPercent = parseFloat(data.memory.percentage);
        const memColor = memPercent > 80 ? chalk.red : memPercent > 60 ? chalk.yellow : chalk.green;
        console.log(`Used: ${data.memory.rss}MB / ${data.memory.limit}MB (${memColor(memPercent + '%')})`);
        console.log(createProgressBar(memPercent));
        
        // Features
        console.log(chalk.magenta.bold('\n✨ Active Features:'));
        Object.entries(data.features).forEach(([feature, active]) => {
            const icon = active ? chalk.green('✓') : chalk.red('✗');
            const name = feature.replace(/([A-Z])/g, ' $1').trim();
            console.log(`${icon} ${name}`);
        });
        
        // Configuration
        if (data.configuration) {
            console.log(chalk.cyan.bold('\n⚙️ Configuration:'));
            if (data.configuration.quantum) {
                console.log(`Quantum: ${chalk.white(data.configuration.quantum.qubits + ' qubits')}`);
            }
            if (data.configuration.neural) {
                console.log(`Neural: ${chalk.white(data.configuration.neural.connections + ' connections')}`);
            }
        }
        
        console.log(chalk.gray('\n─'.repeat(50)));
        console.log(chalk.gray(`Last checked: ${new Date().toLocaleTimeString()}`));
        
    } catch (error) {
        console.error(chalk.red.bold('\n❌ Error checking health:'));
        console.error(chalk.red(error.message));
        
        if (error.code === 'ECONNREFUSED') {
            console.log(chalk.yellow('\n⚠️  App might be starting up. Retrying...'));
        }
    }
}

// Helper functions
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function createProgressBar(percentage) {
    const width = 40;
    const filled = Math.round((width * percentage) / 100);
    const empty = width - filled;
    
    const filledChar = percentage > 80 ? '█' : '█';
    const color = percentage > 80 ? chalk.red : percentage > 60 ? chalk.yellow : chalk.green;
    
    return `[${color(filledChar.repeat(filled))}${chalk.gray('░'.repeat(empty))}]`;
}

// Check for quantum status
async function checkQuantum() {
    try {
        const response = await axios.get(`${APP_URL}/api/quantum/status`);
        const data = response.data;
        
        console.log(chalk.blue.bold('\n🧬 Quantum System Status:'));
        console.log(`Qubits: ${chalk.white(data.qubits)}`);
        console.log(`Algorithms: ${chalk.white(data.algorithms.join(', '))}`);
        
        if (data.performance) {
            console.log(chalk.yellow('\nPerformance Metrics:'));
            Object.entries(data.performance).forEach(([metric, value]) => {
                console.log(`${metric}: ${chalk.white(value)}`);
            });
        }
    } catch (error) {
        // Quantum endpoint might not be ready yet
    }
}

// Main monitoring loop
async function monitor() {
    await checkHealth();
    await checkQuantum();
    
    // Refresh every 5 seconds
    setInterval(async () => {
        await checkHealth();
    }, 5000);
    
    // Check quantum every 30 seconds
    setInterval(async () => {
        await checkQuantum();
    }, 30000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n👋 Stopping monitor...'));
    process.exit(0);
});

// Start monitoring
monitor().catch(error => {
    console.error(chalk.red('Failed to start monitoring:'), error);
});