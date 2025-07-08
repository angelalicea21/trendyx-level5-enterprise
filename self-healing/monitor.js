// ============================================================
// SELF-HEALING MONITOR
// This is the doctor robot that keeps all other robots healthy!
// ============================================================

const EventEmitter = require('events');
const os = require('os');
const { performance } = require('perf_hooks');

// ============================================================
// AUTONOMOUS SELF-HEALING SYSTEM
// ============================================================
class SelfHealingMonitor extends EventEmitter {
    constructor() {
        super();
        this.modelName = process.env.MODULE_NAME || 'SELF_HEALER';
        this.healthStatus = new Map();
        this.issues = new Map();
        this.repairs = new Map();
        this.thresholds = this.initializeThresholds();
        this.healingStrategies = this.initializeHealingStrategies();
        this.initialize();
    }

    initialize() {
        console.log(`🏥 Initializing ${this.modelName}...`);
        
        // Initialize health monitoring
        this.initializeHealthChecks();
        
        // Setup IPC
        this.setupIPC();
        
        // Start monitoring
        this.startMonitoring();
        
        console.log(`✅ ${this.modelName} ready to heal the system!`);
    }

    initializeThresholds() {
        return {
            cpu: {
                warning: 70,
                critical: 90,
                duration: 30000 // 30 seconds
            },
            memory: {
                warning: 80,
                critical: 95,
                duration: 60000 // 1 minute
            },
            responseTime: {
                warning: 1000, // 1 second
                critical: 5000, // 5 seconds
                duration: 10000 // 10 seconds
            },
            errorRate: {
                warning: 0.05, // 5%
                critical: 0.10, // 10%
                duration: 60000 // 1 minute
            },
            queueSize: {
                warning: 1000,
                critical: 5000,
                duration: 30000 // 30 seconds
            }
        };
    }

    initializeHealingStrategies() {
        return {
            high_cpu: [
                { name: 'throttle_requests', action: this.throttleRequests.bind(this) },
                { name: 'scale_workers', action: this.scaleWorkers.bind(this) },
                { name: 'optimize_processing', action: this.optimizeProcessing.bind(this) }
            ],
            high_memory: [
                { name: 'garbage_collect', action: this.forceGarbageCollection.bind(this) },
                { name: 'clear_caches', action: this.clearCaches.bind(this) },
                { name: 'restart_module', action: this.restartModule.bind(this) }
            ],
            slow_response: [
                { name: 'optimize_queries', action: this.optimizeQueries.bind(this) },
                { name: 'enable_caching', action: this.enableCaching.bind(this) },
                { name: 'redistribute_load', action: this.redistributeLoad.bind(this) }
            ],
            high_errors: [
                { name: 'circuit_breaker', action: this.enableCircuitBreaker.bind(this) },
                { name: 'fallback_mode', action: this.enableFallbackMode.bind(this) },
                { name: 'error_recovery', action: this.performErrorRecovery.bind(this) }
            ],
            queue_overflow: [
                { name: 'increase_workers', action: this.increaseWorkers.bind(this) },
                { name: 'priority_queue', action: this.enablePriorityQueue.bind(this) },
                { name: 'drop_low_priority', action: this.dropLowPriorityRequests.bind(this) }
            ]
        };
    }

    initializeHealthChecks() {
        // System health checks
        this.healthChecks = {
            system: this.checkSystemHealth.bind(this),
            modules: this.checkModuleHealth.bind(this),
            connectivity: this.checkConnectivity.bind(this),
            performance: this.checkPerformance.bind(this),
            resources: this.checkResources.bind(this)
        };
    }

    setupIPC() {
        process.on('message', async (message) => {
            const { type, data, correlationId, from } = message;
            
            switch (type) {
                case 'PROCESS':
                    await this.processHealthCheck(data, correlationId);
                    break;
                    
                case 'MONITOR':
                    await this.monitorHealth(data, correlationId);
                    break;
                    
                case 'DIAGNOSE':
                    await this.diagnoseIssues(data, correlationId);
                    break;
                    
                case 'REPAIR':
                    await this.repairIssues(data, correlationId);
                    break;
                    
                case 'MODULE_HEALTH':
                    this.updateModuleHealth(data);
                    break;
                    
                case 'INTER_MODULE_REQUEST':
                    await this.handleInterModuleRequest(from, data, correlationId);
                    break;
                    
                case 'SHUTDOWN':
                    await this.shutdown();
                    break;
            }
        });
        
        process.send({ type: 'READY' });
    }

    startMonitoring() {
        // Health check every 5 seconds
        this.healthCheckInterval = setInterval(() => {
            this.performHealthChecks();
        }, 5000);
        
        // Deep diagnosis every minute
        this.diagnosisInterval = setInterval(() => {
            this.performDeepDiagnosis();
        }, 60000);
        
        // Auto-healing check every 10 seconds
        this.healingInterval = setInterval(() => {
            this.checkAndHeal();
        }, 10000);
        
        // Report metrics every 30 seconds
        this.metricsInterval = setInterval(() => {
            this.reportMetrics();
        }, 30000);
    }

    async processHealthCheck(data, correlationId) {
        const startTime = performance.now();
        
        try {
            const { target, depth = 'basic' } = data;
            let healthReport;
            
            switch (depth) {
                case 'basic':
                    healthReport = await this.performBasicHealthCheck(target);
                    break;
                    
                case 'detailed':
                    healthReport = await this.performDetailedHealthCheck(target);
                    break;
                    
                case 'comprehensive':
                    healthReport = await this.performComprehensiveHealthCheck(target);
                    break;
                    
                default:
                    healthReport = await this.performBasicHealthCheck(target);
            }
            
            const processingTime = performance.now() - startTime;
            
            process.send({
                type: 'RESULT',
                correlationId,
                data: {
                    healthReport,
                    processingTime,
                    timestamp: Date.now()
                }
            });
            
        } catch (error) {
            console.error('Health check error:', error);
            process.send({
                type: 'RESULT',
                correlationId,
                data: { error: error.message }
            });
        }
    }

    async monitorHealth(data, correlationId) {
        const { system_state } = data;
        
        // Update health status
        this.updateHealthStatus(system_state);
        
        // Check for issues
        const issues = this.detectIssues(system_state);
        
        // Store issues for tracking
        if (issues.length > 0) {
            issues.forEach(issue => {
                this.trackIssue(issue);
            });
        }
        
        process.send({
            type: 'RESULT',
            correlationId,
            data: {
                status: 'monitored',
                issues: issues.length,
                health: this.calculateOverallHealth()
            }
        });
    }

    async diagnoseIssues(data, correlationId) {
        const { health_status } = data;
        const diagnosis = {
            issues: [],
            root_causes: [],
            recommendations: []
        };
        
        // Analyze each health metric
        for (const [component, status] of Object.entries(health_status)) {
            if (status.issues && status.issues.length > 0) {
                const componentDiagnosis = await this.diagnoseComponent(component, status);
                diagnosis.issues.push(...componentDiagnosis.issues);
                diagnosis.root_causes.push(...componentDiagnosis.root_causes);
                diagnosis.recommendations.push(...componentDiagnosis.recommendations);
            }
        }
        
        // Correlate issues
        diagnosis.correlations = this.correlateIssues(diagnosis.issues);
        
        // Prioritize recommendations
        diagnosis.recommendations = this.prioritizeRecommendations(diagnosis.recommendations);
        
        process.send({
            type: 'RESULT',
            correlationId,
            data: { diagnosis }
        });
    }

    async repairIssues(data, correlationId) {
        const { diagnosis } = data;
        const repairResults = {
            attempted: [],
            successful: [],
            failed: [],
            deferred: []
        };
        
        // Sort issues by severity
        const sortedIssues = diagnosis.issues.sort((a, b) => 
            this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity)
        );
        
        // Attempt repairs
        for (const issue of sortedIssues) {
            const repairResult = await this.attemptRepair(issue);
            repairResults.attempted.push(issue);
            
            if (repairResult.success) {
                repairResults.successful.push({
                    issue,
                    action: repairResult.action,
                    result: repairResult.result
                });
            } else if (repairResult.deferred) {
                repairResults.deferred.push({
                    issue,
                    reason: repairResult.reason
                });
            } else {
                repairResults.failed.push({
                    issue,
                    error: repairResult.error
                });
            }
        }
        
        process.send({
            type: 'RESULT',
            correlationId,
            data: { repairResults }
        });
    }

    // Health Check Methods
    async performHealthChecks() {
        const health = {};
        
        for (const [name, check] of Object.entries(this.healthChecks)) {
            try {
                health[name] = await check();
            } catch (error) {
                health[name] = {
                    status: 'error',
                    error: error.message
                };
            }
        }
        
        this.healthStatus.set('system', {
            health,
            timestamp: Date.now()
        });
        
        // Check for critical issues
        const criticalIssues = this.findCriticalIssues(health);
        if (criticalIssues.length > 0) {
            this.emit('critical_issues', criticalIssues);
        }
    }

    async checkSystemHealth() {
        const cpuUsage = process.cpuUsage();
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        const cpuPercent = this.calculateCPUPercentage(cpuUsage);
        const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        
        return {
            cpu: {
                usage: cpuPercent,
                status: this.getHealthStatus(cpuPercent, this.thresholds.cpu)
            },
            memory: {
                usage: memoryPercent,
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                status: this.getHealthStatus(memoryPercent, this.thresholds.memory)
            },
            uptime,
            platform: os.platform(),
            nodeVersion: process.version
        };
    }

    async checkModuleHealth() {
        const modules = {};
        
        // Request health from all modules
        process.send({
            type: 'BROADCAST',
            data: {
                type: 'HEALTH_CHECK_REQUEST',
                requestId: Date.now()
            }
        });
        
        // Return cached module health
        this.healthStatus.forEach((status, module) => {
            if (module !== 'system') {
                modules[module] = status;
            }
        });
        
        return modules;
    }

    async checkConnectivity() {
        // Check inter-module connectivity
        const connectivity = {
            modules: 0,
            connections: 0,
            latency: {}
        };
        
        // Ping each module
        const pingResults = await this.pingModules();
        
        connectivity.modules = pingResults.length;
        connectivity.connections = pingResults.filter(r => r.success).length;
        
        pingResults.forEach(result => {
            if (result.success) {
                connectivity.latency[result.module] = result.latency;
            }
        });
        
        return connectivity;
    }

    async checkPerformance() {
        const performance = {
            responseTime: 0,
            throughput: 0,
            errorRate: 0,
            queueSize: 0
        };
        
        // Get performance metrics from modules
        this.healthStatus.forEach((status, module) => {
            if (status.metrics) {
                performance.responseTime += status.metrics.avgResponseTime || 0;
                performance.throughput += status.metrics.throughput || 0;
                performance.errorRate += status.metrics.errorRate || 0;
                performance.queueSize += status.metrics.queueSize || 0;
            }
        });
        
        // Average response time
        const moduleCount = Math.max(this.healthStatus.size - 1, 1);
        performance.responseTime /= moduleCount;
        
        return performance;
    }

    async checkResources() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const cpus = os.cpus();
        
        return {
            memory: {
                total: totalMem,
                free: freeMem,
                used: totalMem - freeMem,
                percentage: ((totalMem - freeMem) / totalMem) * 100
            },
            cpu: {
                count: cpus.length,
                model: cpus[0]?.model,
                speed: cpus[0]?.speed,
                load: os.loadavg()
            },
            disk: await this.checkDiskSpace()
        };
    }

    async checkDiskSpace() {
        // Simplified disk check (would use proper disk utilities in production)
        return {
            available: 1000000000, // 1GB
            used: 500000000, // 500MB
            percentage: 50
        };
    }

    // Diagnosis Methods
    async performDetailedHealthCheck(target) {
        const health = await this.performBasicHealthCheck(target);
        
        // Add detailed metrics
        health.detailed = {
            processes: this.checkProcesses(),
            connections: await this.checkConnections(),
            fileHandles: this.checkFileHandles(),
            eventLoop: this.checkEventLoop()
        };
        
        return health;
    }

    async performComprehensiveHealthCheck(target) {
        const health = await this.performDetailedHealthCheck(target);
        
        // Add comprehensive analysis
        health.comprehensive = {
            trends: this.analyzeTrends(),
            predictions: this.predictIssues(),
            optimization: this.suggestOptimizations(),
            capacity: this.assessCapacity()
        };
        
        return health;
    }

    async performBasicHealthCheck(target) {
        const health = {
            status: 'healthy',
            timestamp: Date.now(),
            checks: {}
        };
        
        if (target === 'all' || !target) {
            // Check all components
            for (const [name, check] of Object.entries(this.healthChecks)) {
                health.checks[name] = await check();
            }
        } else {
            // Check specific target
            if (this.healthChecks[target]) {
                health.checks[target] = await this.healthChecks[target]();
            }
        }
        
        // Determine overall status
        health.status = this.determineOverallStatus(health.checks);
        
        return health;
    }

    async diagnoseComponent(component, status) {
        const diagnosis = {
            issues: [],
            root_causes: [],
            recommendations: []
        };
        
        // Analyze each issue
        for (const issue of status.issues) {
            // Identify root cause
            const rootCause = await this.identifyRootCause(component, issue);
            diagnosis.root_causes.push(rootCause);
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(component, issue, rootCause);
            diagnosis.recommendations.push(...recommendations);
            
            diagnosis.issues.push({
                component,
                issue,
                rootCause,
                severity: this.calculateSeverity(issue)
            });
        }
        
        return diagnosis;
    }

    async identifyRootCause(component, issue) {
        const rootCauses = {
            high_cpu: ['excessive_computation', 'infinite_loops', 'inefficient_algorithms'],
            high_memory: ['memory_leaks', 'large_data_structures', 'cache_overflow'],
            slow_response: ['network_latency', 'database_bottleneck', 'synchronous_operations'],
            high_errors: ['invalid_input', 'external_service_failure', 'configuration_error'],
            queue_overflow: ['insufficient_workers', 'slow_processing', 'traffic_spike']
        };
        
        // Analyze patterns to determine most likely cause
        const possibleCauses = rootCauses[issue.type] || ['unknown'];
        
        // Score each cause based on system state
        const scores = possibleCauses.map(cause => ({
            cause,
            score: this.scoreCause(cause, component, issue)
        }));
        
        // Return most likely cause
        return scores.sort((a, b) => b.score - a.score)[0].cause;
    }

    scoreCause(cause, component, issue) {
        // Simple scoring based on heuristics
        let score = Math.random() * 0.5; // Base random score
        
        // Add specific scoring logic
        if (cause.includes('memory') && issue.metrics?.memory > 80) {
            score += 0.3;
        }
        
        if (cause.includes('cpu') && issue.metrics?.cpu > 70) {
            score += 0.3;
        }
        
        return score;
    }

    generateRecommendations(component, issue, rootCause) {
        const recommendations = [];
        
        // Map root causes to recommendations
        const recommendationMap = {
            excessive_computation: [
                'Optimize algorithms',
                'Implement caching',
                'Add request throttling'
            ],
            memory_leaks: [
                'Review object lifecycle',
                'Implement garbage collection',
                'Use weak references'
            ],
            network_latency: [
                'Implement connection pooling',
                'Add request caching',
                'Use CDN for static assets'
            ],
            insufficient_workers: [
                'Scale up worker processes',
                'Implement auto-scaling',
                'Optimize worker efficiency'
            ]
        };
        
        const actions = recommendationMap[rootCause] || ['Monitor and investigate further'];
        
        actions.forEach(action => {
            recommendations.push({
                component,
                issue: issue.type,
                action,
                priority: this.calculatePriority(issue),
                estimatedImpact: 'medium'
            });
        });
        
        return recommendations;
    }

    // Healing Methods
    async attemptRepair(issue) {
        const strategies = this.healingStrategies[issue.type];
        
        if (!strategies || strategies.length === 0) {
            return {
                success: false,
                error: 'No healing strategy available'
            };
        }
        
        // Try each strategy in order
        for (const strategy of strategies) {
            try {
                console.log(`🔧 Attempting repair: ${strategy.name} for ${issue.type}`);
                
                const result = await strategy.action(issue);
                
                if (result.success) {
                    // Record successful repair
                    this.recordRepair(issue, strategy, result);
                    
                    return {
                        success: true,
                        action: strategy.name,
                        result
                    };
                }
                
            } catch (error) {
                console.error(`Repair strategy ${strategy.name} failed:`, error);
            }
        }
        
        return {
            success: false,
            error: 'All healing strategies failed'
        };
    }

    // Healing Strategies
    async throttleRequests(issue) {
        console.log('Throttling requests to reduce CPU load...');
        
        process.send({
            type: 'BROADCAST',
            data: {
                type: 'THROTTLE_REQUESTS',
                percentage: 50,
                duration: 60000 // 1 minute
            }
        });
        
        return { success: true, throttled: true };
    }

    async scaleWorkers(issue) {
        console.log('Scaling workers to handle load...');
        
        process.send({
            type: 'SCALE_REQUEST',
            data: {
                modules: [issue.component],
                action: 'scale_up',
                count: 2
            }
        });
        
        return { success: true, scaled: true };
    }

    async optimizeProcessing(issue) {
        console.log('Optimizing processing algorithms...');
        
        process.send({
            type: 'BROADCAST',
            data: {
                type: 'OPTIMIZE_PROCESSING',
                level: 'aggressive'
            }
        });
        
        return { success: true, optimized: true };
    }

    async forceGarbageCollection(issue) {
        console.log('Forcing garbage collection...');
        
        if (global.gc) {
            global.gc();
            return { success: true, gcPerformed: true };
        }
        
        return { success: false, error: 'GC not exposed' };
    }

    async clearCaches(issue) {
        console.log('Clearing caches to free memory...');
        
        process.send({
            type: 'BROADCAST',
            data: {
                type: 'CLEAR_CACHES',
                level: 'all'
            }
        });
        
        return { success: true, cachesCleared: true };
    }

    async restartModule(issue) {
        console.log(`Restarting module ${issue.component}...`);
        
        process.send({
            type: 'RESTART_MODULE',
            data: {
                module: issue.component,
                graceful: true
            }
        });
        
        return { success: true, restarted: true };
    }

    async optimizeQueries(issue) {
        console.log('Optimizing database queries...');
        
        process.send({
            type: 'BROADCAST',
            data: {
                type: 'OPTIMIZE_QUERIES',
                indexes: true,
                cache: true
            }
        });
        
        return { success: true, queriesOptimized: true };
    }

    async enableCaching(issue) {
        console.log('Enabling aggressive caching...');
        
        process.send({
            type: 'BROADCAST',
            data: {
                type: 'ENABLE_CACHING',
                level: 'aggressive',
                ttl: 3600000 // 1 hour
            }
        });
        
        return { success: true, cachingEnabled: true };
    }

    async redistributeLoad(issue) {
        console.log('Redistributing load across modules...');
        
        process.send({
            type: 'LOAD_BALANCE',
            data: {
                strategy: 'least_loaded',
                rebalance: true
            }
        });
        
        return { success: true, loadRedistributed: true };
    }

    async enableCircuitBreaker(issue) {
        console.log('Enabling circuit breaker pattern...');
        
        process.send({
            type: 'BROADCAST',
            data: {
                type: 'CIRCUIT_BREAKER',
                enabled: true,
                threshold: 50,
                timeout: 60000
            }
        });
        
        return { success: true, circuitBreakerEnabled: true };
    }

    async enableFallbackMode(issue) {
        console.log('Enabling fallback mode...');
        
        process.send({
            type: 'BROADCAST',
            data: {
                type: 'FALLBACK_MODE',
                enabled: true,
                level: 'degraded'
            }
        });
        
        return { success: true, fallbackEnabled: true };
    }

    async performErrorRecovery(issue) {
        console.log('Performing error recovery...');
        
        process.send({
            type: 'BROADCAST',
            data: {
                type: 'ERROR_RECOVERY',
                clearErrors: true,
                resetState: true
            }
        });
        
        return { success: true, recoveryPerformed: true };
    }

    async increaseWorkers(issue) {
        console.log('Increasing worker count...');
        
        process.send({
            type: 'WORKER_ADJUSTMENT',
            data: {
                action: 'increase',
                count: Math.min(os.cpus().length, 8)
            }
        });
        
        return { success: true, workersIncreased: true };
    }

    async enablePriorityQueue(issue) {
        console.log('Enabling priority queue processing...');
        
        process.send({
            type: 'BROADCAST',
            data: {
                type: 'PRIORITY_QUEUE',
                enabled: true,
                priorities: ['critical', 'high', 'normal', 'low']
            }
        });
        
        return { success: true, priorityQueueEnabled: true };
    }

    async dropLowPriorityRequests(issue) {
        console.log('Dropping low priority requests...');
        
        process.send({
            type: 'BROADCAST',
            data: {
                type: 'DROP_REQUESTS',
                priority: 'low',
                percentage: 50
            }
        });
        
        return { success: true, requestsDropped: true };
    }

    // Helper Methods
    calculateCPUPercentage(cpuUsage) {
        const totalUsage = cpuUsage.user + cpuUsage.system;
        const totalTime = process.uptime() * 1000000; // Convert to microseconds
        return (totalUsage / totalTime) * 100;
    }

    getHealthStatus(value, threshold) {
        if (value >= threshold.critical) return 'critical';
        if (value >= threshold.warning) return 'warning';
        return 'healthy';
    }

    updateHealthStatus(systemState) {
        Object.entries(systemState).forEach(([component, state]) => {
            this.healthStatus.set(component, {
                ...state,
                lastUpdate: Date.now()
            });
        });
    }

    detectIssues(systemState) {
        const issues = [];
        
        Object.entries(systemState).forEach(([component, state]) => {
            // Check each metric against thresholds
            Object.entries(this.thresholds).forEach(([metric, threshold]) => {
                if (state[metric] && state[metric] > threshold.warning) {
                    issues.push({
                        component,
                        type: metric,
                        value: state[metric],
                        threshold: state[metric] > threshold.critical ? 'critical' : 'warning',
                        timestamp: Date.now()
                    });
                }
            });
        });
        
        return issues;
    }

    trackIssue(issue) {
        const key = `${issue.component}_${issue.type}`;
        
        if (!this.issues.has(key)) {
            this.issues.set(key, {
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                occurrences: 1,
                history: [issue]
            });
        } else {
            const tracked = this.issues.get(key);
            tracked.lastSeen = Date.now();
            tracked.occurrences++;
            tracked.history.push(issue);
            
            // Keep only last 100 occurrences
            if (tracked.history.length > 100) {
                tracked.history = tracked.history.slice(-100);
            }
        }
    }

    calculateOverallHealth() {
        let totalScore = 0;
        let componentCount = 0;
        
        this.healthStatus.forEach((status, component) => {
            if (status.health) {
                const score = this.calculateHealthScore(status.health);
                totalScore += score;
                componentCount++;
            }
        });
        
        return componentCount > 0 ? totalScore / componentCount : 100;
    }

    calculateHealthScore(health) {
        let score = 100;
        
        // Deduct points for issues
        if (health.cpu?.status === 'warning') score -= 10;
        if (health.cpu?.status === 'critical') score -= 25;
        
        if (health.memory?.status === 'warning') score -= 10;
        if (health.memory?.status === 'critical') score -= 25;
        
        if (health.errorRate > 0.05) score -= 15;
        if (health.errorRate > 0.10) score -= 25;
        
        return Math.max(0, score);
    }

    findCriticalIssues(health) {
        const critical = [];
        
        Object.entries(health).forEach(([component, status]) => {
            if (status.status === 'critical' || status.status === 'error') {
                critical.push({
                    component,
                    status: status.status,
                    details: status
                });
            }
        });
        
        return critical;
    }

    correlateIssues(issues) {
        const correlations = [];
        
        // Find issues that occur together
        for (let i = 0; i < issues.length; i++) {
            for (let j = i + 1; j < issues.length; j++) {
                const timeDiff = Math.abs(issues[i].timestamp - issues[j].timestamp);
                
                // Issues within 5 seconds might be related
                if (timeDiff < 5000) {
                    correlations.push({
                        issues: [issues[i], issues[j]],
                        correlation: 'temporal',
                        confidence: 1 - (timeDiff / 5000)
                    });
                }
            }
        }
        
        return correlations;
    }

    prioritizeRecommendations(recommendations) {
        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    getSeverityScore(severity) {
        const scores = {
            critical: 100,
            high: 75,
            medium: 50,
            low: 25,
            info: 10
        };
        
        return scores[severity] || 0;
    }

    calculateSeverity(issue) {
        if (issue.threshold === 'critical') return 'critical';
        if (issue.occurrences > 10) return 'high';
        if (issue.occurrences > 5) return 'medium';
        return 'low';
    }

    calculatePriority(issue) {
        const severity = this.calculateSeverity(issue);
        
        if (severity === 'critical') return 'critical';
        if (severity === 'high' && issue.component === 'ORCHESTRATOR') return 'critical';
        if (severity === 'high') return 'high';
        if (severity === 'medium') return 'medium';
        return 'low';
    }

    recordRepair(issue, strategy, result) {
        const repair = {
            issue,
            strategy: strategy.name,
            result,
            timestamp: Date.now()
        };
        
        if (!this.repairs.has(issue.type)) {
            this.repairs.set(issue.type, []);
        }
        
        this.repairs.get(issue.type).push(repair);
    }

    determineOverallStatus(checks) {
        let hasError = false;
        let hasCritical = false;
        let hasWarning = false;
        
        Object.values(checks).forEach(check => {
            if (check.status === 'error') hasError = true;
            if (check.status === 'critical') hasCritical = true;
            if (check.status === 'warning') hasWarning = true;
        });
        
        if (hasError || hasCritical) return 'critical';
        if (hasWarning) return 'warning';
        return 'healthy';
    }

    checkProcesses() {
        return {
            pid: process.pid,
            ppid: process.ppid,
            title: process.title,
            argv: process.argv.slice(0, 3)
        };
    }

    async checkConnections() {
        // Simplified connection check
        return {
            active: Math.floor(Math.random() * 100),
            idle: Math.floor(Math.random() * 50),
            total: 150
        };
    }

    checkFileHandles() {
        // Simplified file handle check
        return {
            open: Math.floor(Math.random() * 100),
            max: 1024
        };
    }

    checkEventLoop() {
        // Measure event loop lag
        const start = Date.now();
        
        return new Promise(resolve => {
            setImmediate(() => {
                const lag = Date.now() - start;
                resolve({
                    lag,
                    status: lag > 100 ? 'slow' : 'normal'
                });
            });
        });
    }

    analyzeTrends() {
        const trends = {
            cpu: 'stable',
            memory: 'increasing',
            errors: 'decreasing'
        };
        
        // Analyze historical data
        this.issues.forEach((issue, key) => {
            if (issue.occurrences > 5) {
                const [component, type] = key.split('_');
                trends[type] = 'increasing';
            }
        });
        
        return trends;
    }

    predictIssues() {
        const predictions = [];
        
        // Simple prediction based on trends
        this.issues.forEach((issue, key) => {
            if (issue.occurrences > 3) {
                const rate = issue.occurrences / ((Date.now() - issue.firstSeen) / 60000);
                
                if (rate > 1) {
                    predictions.push({
                        issue: key,
                        probability: Math.min(rate / 10, 1),
                        timeframe: '1 hour'
                    });
                }
            }
        });
        
        return predictions;
    }

    suggestOptimizations() {
        const optimizations = [];
        
        // Based on current system state
        const health = this.calculateOverallHealth();
        
        if (health < 80) {
            optimizations.push('Enable caching for frequently accessed data');
        }
        
        if (health < 60) {
            optimizations.push('Scale up infrastructure');
            optimizations.push('Implement request queuing');
        }
        
        return optimizations;
    }

    assessCapacity() {
        const currentLoad = this.calculateOverallHealth();
        const maxCapacity = 100;
        
        return {
            current: 100 - currentLoad,
            maximum: maxCapacity,
            available: currentLoad,
            recommendation: currentLoad > 80 ? 'Scale up soon' : 'Adequate capacity'
        };
    }

    async pingModules() {
        // Simplified ping implementation
        const modules = ['CONTENT_ENGINE', 'NEURAL_PROCESSOR', 'ORCHESTRATOR'];
        
        return modules.map(module => ({
            module,
            success: Math.random() > 0.1,
            latency: Math.random() * 100
        }));
    }

    updateModuleHealth(data) {
        const { module, health } = data;
        
        this.healthStatus.set(module, {
            health,
            lastUpdate: Date.now()
        });
    }

    async performDeepDiagnosis() {
        console.log('🔍 Performing deep system diagnosis...');
        
        // Comprehensive system analysis
        const diagnosis = {
            systemTrends: this.analyzeTrends(),
            predictions: this.predictIssues(),
            correlations: this.findCorrelations(),
            recommendations: this.generateSystemRecommendations()
        };
        
        // Log significant findings
        if (diagnosis.predictions.length > 0) {
            console.log('⚠️ Predicted issues:', diagnosis.predictions);
        }
    }

    findCorrelations() {
        const correlations = [];
        
        // Find patterns in issues
        const issueTypes = new Map();
        
        this.issues.forEach((issue, key) => {
            const [component, type] = key.split('_');
            
            if (!issueTypes.has(type)) {
                issueTypes.set(type, []);
            }
            
            issueTypes.get(type).push(component);
        });
        
        // Check for cross-component issues
        issueTypes.forEach((components, type) => {
            if (components.length > 1) {
                correlations.push({
                    type,
                    components,
                    correlation: 'cross-component'
                });
            }
        });
        
        return correlations;
    }

    generateSystemRecommendations() {
        const recommendations = [];
        const health = this.calculateOverallHealth();
        
        if (health < 90) {
            recommendations.push({
                action: 'Review system logs for errors',
                priority: 'medium'
            });
        }
        
        if (health < 70) {
            recommendations.push({
                action: 'Consider system maintenance window',
                priority: 'high'
            });
        }
        
        if (this.issues.size > 10) {
            recommendations.push({
                action: 'Investigate root cause of recurring issues',
                priority: 'high'
            });
        }
        
        return recommendations;
    }

    async checkAndHeal() {
        // Auto-healing logic
        const criticalIssues = [];
        
        this.issues.forEach((issue, key) => {
            if (issue.occurrences > 5 && 
                Date.now() - issue.lastSeen < 60000) { // Active in last minute
                criticalIssues.push({
                    key,
                    issue,
                    type: key.split('_')[1]
                });
            }
        });
        
        // Attempt to heal critical issues
        for (const critical of criticalIssues) {
            console.log(`🚨 Auto-healing critical issue: ${critical.key}`);
            
            const repairResult = await this.attemptRepair({
                type: critical.type,
                component: critical.key.split('_')[0]
            });
            
            if (repairResult.success) {
                console.log(`✅ Successfully healed: ${critical.key}`);
                // Reset issue tracking
                this.issues.delete(critical.key);
            }
        }
    }

    reportMetrics() {
        const metrics = {
            overallHealth: this.calculateOverallHealth(),
            activeIssues: this.issues.size,
            successfulRepairs: Array.from(this.repairs.values())
                .reduce((sum, repairs) => sum + repairs.length, 0),
            moduleHealth: Object.fromEntries(this.healthStatus),
            predictions: this.predictIssues()
        };
        
        process.send({
            type: 'METRICS',
            data: metrics
        });
    }

    async handleInterModuleRequest(from, data, correlationId) {
        switch (data.action) {
            case 'HEALTH_CHECK':
                const health = await this.performBasicHealthCheck('all');
                process.send({
                    type: 'INTER_MODULE_REQUEST',
                    targetModule: from,
                    action: 'HEALTH_CHECK_RESULT',
                    data: { health },
                    correlationId
                });
                break;
                
            case 'DIAGNOSE':
                const diagnosis = await this.diagnoseComponent(from, data.status);
                process.send({
                    type: 'INTER_MODULE_REQUEST',
                    targetModule: from,
                    action: 'DIAGNOSIS_RESULT',
                    data: { diagnosis },
                    correlationId
                });
                break;
                
            case 'REPAIR':
                const repair = await this.attemptRepair(data.issue);
                process.send({
                    type: 'INTER_MODULE_REQUEST',
                    targetModule: from,
                    action: 'REPAIR_RESULT',
                    data: { repair },
                    correlationId
                });
                break;
        }
    }

    async shutdown() {
        console.log(`[${this.modelName}] Shutting down health monitor...`);
        
        // Clear intervals
        clearInterval(this.healthCheckInterval);
        clearInterval(this.diagnosisInterval);
        clearInterval(this.healingInterval);
        clearInterval(this.metricsInterval);
        
        // Save state
        const state = {
            issues: Array.from(this.issues.entries()),
            repairs: Array.from(this.repairs.entries()),
            finalHealth: this.calculateOverallHealth(),
            timestamp: Date.now()
        };
        
        console.log(`[${this.modelName}] Final health: ${state.finalHealth}%`);
        console.log(`[${this.modelName}] Shutdown complete`);
        
        process.exit(0);
    }
}

// ============================================================
// INITIALIZE AND RUN
// ============================================================
const selfHealer = new SelfHealingMonitor();

// Error handlers
process.on('uncaughtException', (error) => {
    console.error(`[${selfHealer.modelName}] Uncaught exception:`, error);
    process.send({
        type: 'ERROR',
        data: { error: error.message, stack: error.stack }
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${selfHealer.modelName}] Unhandled rejection:`, reason);
});