// ============================================================
// HEALTH MONITOR SCRIPT
// Monitors the health of the TrendyX AI Level 5 system
// ============================================================

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    healthEndpoint: process.env.HEALTH_ENDPOINT || 'http://localhost:3000/health',
    metricsEndpoint: process.env.METRICS_ENDPOINT || 'http://localhost:3000/metrics',
    checkInterval: parseInt(process.env.MONITOR_INTERVAL) || 30000, // 30 seconds
    alertThreshold: {
        cpu: 80,
        memory: 85,
        errorRate: 5,
        responseTime: 5000
    },
    logFile: path.join(__dirname, '..', 'logs', 'health-monitor.log')
};

// Health status tracking
const healthHistory = {
    checks: [],
    alerts: [],
    startTime: Date.now()
};

// Logger
function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };
    
    console.log(`[${timestamp}] [${level}] ${message}`, data);
    
    // Write to log file
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(config.logFile, logLine);
}

// Make HTTP request
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const startTime = Date.now();
        
        client.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                
                try {
                    const json = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: json,
                        responseTime
                    });
                } catch (error) {
                    reject(new Error(`Invalid JSON response: ${error.message}`));
                }
            });
        }).on('error', reject);
    });
}

// Check system health
async function checkHealth() {
    try {
        const health = await makeRequest(config.healthEndpoint);
        
        if (health.status !== 200) {
            throw new Error(`Health check returned status ${health.status}`);
        }
        
        const healthData = health.data;
        const alerts = [];
        
        // Check ecosystem health
        if (healthData.ecosystem) {
            const ecosystem = healthData.ecosystem;
            
            // Check CPU usage
            const cpuUsage = calculateAverageCPU(ecosystem);
            if (cpuUsage > config.alertThreshold.cpu) {
                alerts.push({
                    type: 'cpu',
                    severity: 'warning',
                    message: `High CPU usage: ${cpuUsage.toFixed(2)}%`,
                    value: cpuUsage
                });
            }
            
            // Check memory usage
            const memoryUsage = calculateAverageMemory(ecosystem);
            if (memoryUsage > config.alertThreshold.memory) {
                alerts.push({
                    type: 'memory',
                    severity: 'warning',
                    message: `High memory usage: ${memoryUsage.toFixed(2)}%`,
                    value: memoryUsage
                });
            }
            
            // Check module health
            const unhealthyModules = checkModuleHealth(ecosystem);
            if (unhealthyModules.length > 0) {
                alerts.push({
                    type: 'modules',
                    severity: 'error',
                    message: `Unhealthy modules: ${unhealthyModules.join(', ')}`,
                    modules: unhealthyModules
                });
            }
        }
        
        // Check response time
        if (health.responseTime > config.alertThreshold.responseTime) {
            alerts.push({
                type: 'performance',
                severity: 'warning',
                message: `Slow response time: ${health.responseTime}ms`,
                value: health.responseTime
            });
        }
        
        // Record health check
        const checkResult = {
            timestamp: Date.now(),
            status: alerts.length === 0 ? 'healthy' : 'unhealthy',
            responseTime: health.responseTime,
            alerts,
            data: healthData
        };
        
        healthHistory.checks.push(checkResult);
        
        // Keep only last 100 checks
        if (healthHistory.checks.length > 100) {
            healthHistory.checks = healthHistory.checks.slice(-100);
        }
        
        // Process alerts
        if (alerts.length > 0) {
            handleAlerts(alerts);
        } else {
            log('info', 'Health check passed', {
                responseTime: health.responseTime,
                status: healthData.status
            });
        }
        
        return checkResult;
        
    } catch (error) {
        const errorResult = {
            timestamp: Date.now(),
            status: 'error',
            error: error.message
        };
        
        healthHistory.checks.push(errorResult);
        
        log('error', 'Health check failed', {
            error: error.message,
            stack: error.stack
        });
        
        handleSystemDown(error);
        
        return errorResult;
    }
}

// Calculate average CPU usage
function calculateAverageCPU(ecosystem) {
    if (!ecosystem.modules) return 0;
    
    let totalCPU = 0;
    let count = 0;
    
    Object.values(ecosystem.modules).forEach(module => {
        if (module.metrics && module.metrics.cpu) {
            totalCPU += module.metrics.cpu.usage || 0;
            count++;
        }
    });
    
    return count > 0 ? totalCPU / count : 0;
}

// Calculate average memory usage
function calculateAverageMemory(ecosystem) {
    if (!ecosystem.modules) return 0;
    
    let totalMemory = 0;
    let count = 0;
    
    Object.values(ecosystem.modules).forEach(module => {
        if (module.metrics && module.metrics.memory) {
            const usage = (module.metrics.memory.heapUsed / module.metrics.memory.heapTotal) * 100;
            totalMemory += usage;
            count++;
        }
    });
    
    return count > 0 ? totalMemory / count : 0;
}

// Check module health
function checkModuleHealth(ecosystem) {
    const unhealthy = [];
    
    if (!ecosystem.modules) return unhealthy;
    
    Object.entries(ecosystem.modules).forEach(([name, module]) => {
        if (!module.connected || module.status !== 'active') {
            unhealthy.push(name);
        }
    });
    
    return unhealthy;
}

// Handle alerts
function handleAlerts(alerts) {
    alerts.forEach(alert => {
        log('alert', alert.message, alert);
        
        // Add to alert history
        healthHistory.alerts.push({
            ...alert,
            timestamp: Date.now()
        });
    });
    
    // Keep only last 100 alerts
    if (healthHistory.alerts.length > 100) {
        healthHistory.alerts = healthHistory.alerts.slice(-100);
    }
    
    // Send notifications (implement your notification logic here)
    sendNotifications(alerts);
}

// Handle system down
function handleSystemDown(error) {
    log('critical', 'System appears to be down!', {
        error: error.message
    });
    
    // Implement recovery actions here
    // For example: restart services, send emergency notifications
}

// Send notifications
function sendNotifications(alerts) {
    // Implement notification logic
    // Examples:
    // - Send email
    // - Send Slack message
    // - Send SMS
    // - Trigger PagerDuty
    
    const criticalAlerts = alerts.filter(a => a.severity === 'error' || a.severity === 'critical');
    
    if (criticalAlerts.length > 0) {
        log('info', `Would send ${criticalAlerts.length} critical notifications`);
    }
}

// Generate health report
function generateHealthReport() {
    const uptime = Date.now() - healthHistory.startTime;
    const totalChecks = healthHistory.checks.length;
    const healthyChecks = healthHistory.checks.filter(c => c.status === 'healthy').length;
    const healthPercentage = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0;
    
    const report = {
        uptime,
        totalChecks,
        healthyChecks,
        healthPercentage,
        recentAlerts: healthHistory.alerts.slice(-10),
        lastCheck: healthHistory.checks[healthHistory.checks.length - 1],
        systemStatus: healthPercentage > 95 ? 'excellent' :
                     healthPercentage > 80 ? 'good' :
                     healthPercentage > 60 ? 'fair' : 'poor'
    };
    
    return report;
}

// HTTP server for health monitor status
function startStatusServer() {
    const server = http.createServer((req, res) => {
        if (req.url === '/status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(generateHealthReport(), null, 2));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });
    
    const port = process.env.MONITOR_PORT || 3001;
    server.listen(port, () => {
        log('info', `Health monitor status server listening on port ${port}`);
    });
}

// Main monitoring loop
async function startMonitoring() {
    log('info', 'Health monitor started', {
        checkInterval: config.checkInterval,
        endpoints: {
            health: config.healthEndpoint,
            metrics: config.metricsEndpoint
        }
    });
    
    // Initial check
    await checkHealth();
    
    // Regular checks
    setInterval(async () => {
        await checkHealth();
    }, config.checkInterval);
    
    // Generate reports every 5 minutes
    setInterval(() => {
        const report = generateHealthReport();
        log('info', 'Health report generated', report);
    }, 300000);
}

// Graceful shutdown
process.on('SIGTERM', () => {
    log('info', 'Health monitor shutting down...');
    
    const finalReport = generateHealthReport();
    log('info', 'Final health report', finalReport);
    
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    log('error', 'Uncaught exception in health monitor', {
        error: error.message,
        stack: error.stack
    });
});

process.on('unhandledRejection', (reason, promise) => {
    log('error', 'Unhandled rejection in health monitor', {
        reason,
        promise
    });
});

// Start monitoring
startStatusServer();
startMonitoring();

log('info', 'TrendyX AI Level 5 Health Monitor initialized');