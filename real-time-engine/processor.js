// ============================================================
// REAL-TIME ENGINE PROCESSOR
// This super fast robot processes everything in real-time!
// ============================================================

const EventEmitter = require('events');
const { Transform, Writable } = require('stream');
const { performance } = require('perf_hooks');

// ============================================================
// HIGH-PERFORMANCE REAL-TIME PROCESSING ENGINE
// ============================================================
class RealTimeEngine extends EventEmitter {
    constructor() {
        super();
        this.modelName = process.env.MODULE_NAME || 'REALTIME_ENGINE';
        this.streams = new Map();
        this.processors = new Map();
        this.eventHandlers = new Map();
        this.metrics = {
            eventsProcessed: 0,
            averageLatency: 0,
            throughput: 0,
            activeStreams: 0
        };
        this.initialize();
    }

    initialize() {
        console.log(`⚡ Initializing ${this.modelName}...`);
        
        // Initialize stream processors
        this.initializeProcessors();
        
        // Setup IPC
        this.setupIPC();
        
        // Start real-time engine
        this.startEngine();
        
        console.log(`✅ ${this.modelName} ready for real-time processing!`);
    }

    initializeProcessors() {
        // Text Stream Processor
        this.processors.set('text', {
            name: 'TextStreamProcessor',
            transform: this.createTextProcessor(),
            bufferSize: 1024,
            encoding: 'utf8'
        });

        // Data Stream Processor
        this.processors.set('data', {
            name: 'DataStreamProcessor',
            transform: this.createDataProcessor(),
            bufferSize: 4096,
            encoding: 'json'
        });

        // Event Stream Processor
        this.processors.set('event', {
            name: 'EventStreamProcessor',
            transform: this.createEventProcessor(),
            bufferSize: 512,
            encoding: 'json'
        });

        // Analytics Stream Processor
        this.processors.set('analytics', {
            name: 'AnalyticsStreamProcessor',
            transform: this.createAnalyticsProcessor(),
            bufferSize: 2048,
            encoding: 'json'
        });

        // ML Stream Processor
        this.processors.set('ml', {
            name: 'MLStreamProcessor',
            transform: this.createMLProcessor(),
            bufferSize: 8192,
            encoding: 'binary'
        });
    }

    setupIPC() {
        process.on('message', async (message) => {
            const { type, data, correlationId, from } = message;
            
            switch (type) {
                case 'PROCESS':
                    await this.processRealTime(data, correlationId);
                    break;
                    
                case 'CREATE_STREAM':
                    this.createStream(data, correlationId);
                    break;
                    
                case 'DESTROY_STREAM':
                    this.destroyStream(data.streamId);
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

    startEngine() {
        // Metrics collection every second
        setInterval(() => {
            this.collectMetrics();
        }, 1000);
        
        // Report metrics every 30 seconds
        setInterval(() => {
            this.reportMetrics();
        }, 30000);
        
        // Garbage collection for inactive streams
        setInterval(() => {
            this.cleanupInactiveStreams();
        }, 60000);
    }

    async processRealTime(data, correlationId) {
        const startTime = performance.now();
        
        try {
            const { type, content, options = {} } = data;
            let result;
            
            switch (type) {
                case 'stream_process':
                    result = await this.streamProcess(content, options);
                    break;
                    
                case 'real_time_analysis':
                    result = await this.realTimeAnalysis(content, options);
                    break;
                    
                case 'event_handling':
                    result = await this.handleEvents(content, options);
                    break;
                    
                case 'live_transformation':
                    result = await this.liveTransformation(content, options);
                    break;
                    
                default:
                    result = await this.defaultProcess(content, options);
            }
            
            const latency = performance.now() - startTime;
            this.updateMetrics(latency);
            
            process.send({
                type: 'RESULT',
                correlationId,
                data: {
                    result,
                    metrics: {
                        latency,
                        timestamp: Date.now(),
                        throughput: this.metrics.throughput
                    }
                }
            });
            
        } catch (error) {
            console.error('Real-time processing error:', error);
            process.send({
                type: 'RESULT',
                correlationId,
                data: { error: error.message }
            });
        }
    }

    createStream(config, correlationId) {
        const { streamId, type, options = {} } = config;
        
        if (this.streams.has(streamId)) {
            console.warn(`Stream ${streamId} already exists`);
            return;
        }
        
        const processor = this.processors.get(type) || this.processors.get('data');
        const stream = {
            id: streamId,
            type,
            processor: processor.transform(),
            buffer: [],
            created: Date.now(),
            lastActivity: Date.now(),
            metrics: {
                processed: 0,
                errors: 0,
                avgLatency: 0
            },
            options
        };
        
        // Setup stream pipeline
        stream.processor.on('data', (chunk) => {
            this.handleStreamData(streamId, chunk);
        });
        
        stream.processor.on('error', (error) => {
            console.error(`Stream ${streamId} error:`, error);
            stream.metrics.errors++;
        });
        
        this.streams.set(streamId, stream);
        this.metrics.activeStreams++;
        
        console.log(`✅ Stream ${streamId} created`);
        
        process.send({
            type: 'STREAM_CREATED',
            correlationId,
            data: { streamId, type }
        });
    }

    destroyStream(streamId) {
        const stream = this.streams.get(streamId);
        
        if (!stream) {
            console.warn(`Stream ${streamId} not found`);
            return;
        }
        
        // Clean up
        stream.processor.destroy();
        this.streams.delete(streamId);
        this.metrics.activeStreams--;
        
        console.log(`✅ Stream ${streamId} destroyed`);
    }

    async streamProcess(content, options) {
        const { streamId, data } = content;
        const stream = this.streams.get(streamId);
        
        if (!stream) {
            throw new Error(`Stream ${streamId} not found`);
        }
        
        const startTime = performance.now();
        
        // Process through stream
        return new Promise((resolve, reject) => {
            const results = [];
            
            // Create temporary result collector
            const collector = new Writable({
                write(chunk, encoding, callback) {
                    results.push(chunk);
                    callback();
                },
                final(callback) {
                    const latency = performance.now() - startTime;
                    stream.metrics.processed++;
                    stream.metrics.avgLatency = 
                        (stream.metrics.avgLatency * (stream.metrics.processed - 1) + latency) / 
                        stream.metrics.processed;
                    
                    resolve({
                        streamId,
                        processed: results.length,
                        latency,
                        results: results.slice(0, 10) // Return first 10 results
                    });
                    callback();
                }
            });
            
            // Pipe data through processor
            stream.processor.pipe(collector);
            
            // Write data
            if (Array.isArray(data)) {
                data.forEach(item => stream.processor.write(item));
            } else {
                stream.processor.write(data);
            }
            
            // Signal end
            stream.processor.end();
        });
    }

    async realTimeAnalysis(content, options) {
        const { data, analysisType = 'sentiment' } = content;
        const results = [];
        const startTime = performance.now();
        
        // Create analysis pipeline
        const analyzer = this.createAnalysisPipeline(analysisType);
        
        // Process data in chunks for real-time response
        const chunkSize = options.chunkSize || 100;
        const chunks = this.chunkArray(data, chunkSize);
        
        for (const chunk of chunks) {
            const chunkResult = await this.analyzeChunk(chunk, analyzer);
            results.push(chunkResult);
            
            // Emit intermediate results
            if (options.emitIntermediateResults) {
                process.send({
                    type: 'INTERMEDIATE_RESULT',
                    data: {
                        progress: results.length / chunks.length,
                        partialResult: chunkResult
                    }
                });
            }
        }
        
        const totalLatency = performance.now() - startTime;
        
        return {
            type: 'real_time_analysis',
            analysisType,
            results,
            summary: this.summarizeAnalysis(results, analysisType),
            metrics: {
                totalItems: data.length,
                chunksProcessed: chunks.length,
                totalLatency,
                avgLatencyPerItem: totalLatency / data.length
            }
        };
    }

    async handleEvents(content, options) {
        const { events, handlers = [] } = content;
        const results = [];
        
        // Register handlers
        handlers.forEach(handler => {
            this.registerEventHandler(handler.eventType, handler.action);
        });
        
        // Process events
        for (const event of events) {
            const startTime = performance.now();
            
            try {
                const result = await this.processEvent(event);
                const latency = performance.now() - startTime;
                
                results.push({
                    eventId: event.id,
                    type: event.type,
                    status: 'processed',
                    result,
                    latency
                });
                
                this.metrics.eventsProcessed++;
                
            } catch (error) {
                results.push({
                    eventId: event.id,
                    type: event.type,
                    status: 'error',
                    error: error.message,
                    latency: performance.now() - startTime
                });
            }
        }
        
        return {
            type: 'event_handling',
            processed: results.length,
            successful: results.filter(r => r.status === 'processed').length,
            failed: results.filter(r => r.status === 'error').length,
            results
        };
    }

    async liveTransformation(content, options) {
        const { input, transformations = [] } = content;
        let result = input;
        const steps = [];
        
        // Apply transformations in sequence
        for (const transform of transformations) {
            const startTime = performance.now();
            
            try {
                result = await this.applyTransformation(result, transform);
                
                steps.push({
                    transformation: transform.type,
                    status: 'success',
                    latency: performance.now() - startTime
                });
                
            } catch (error) {
                steps.push({
                    transformation: transform.type,
                    status: 'error',
                    error: error.message,
                    latency: performance.now() - startTime
                });
                
                if (!options.continueOnError) {
                    break;
                }
            }
        }
        
        return {
            type: 'live_transformation',
            original: input,
            transformed: result,
            steps,
            totalTransformations: transformations.length,
            successfulTransformations: steps.filter(s => s.status === 'success').length
        };
    }

    // Stream Processors
    createTextProcessor() {
        return () => new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                try {
                    const text = chunk.toString();
                    
                    // Real-time text processing
                    const processed = {
                        original: text,
                        lowercase: text.toLowerCase(),
                        uppercase: text.toUpperCase(),
                        wordCount: text.split(/\s+/).length,
                        charCount: text.length,
                        sentiment: this.quickSentiment(text),
                        keywords: this.extractKeywords(text),
                        timestamp: Date.now()
                    };
                    
                    callback(null, processed);
                } catch (error) {
                    callback(error);
                }
            },
            
            quickSentiment(text) {
                // Simple sentiment scoring
                const positive = ['good', 'great', 'excellent', 'happy', 'love'];
                const negative = ['bad', 'terrible', 'hate', 'sad', 'awful'];
                
                const words = text.toLowerCase().split(/\s+/);
                let score = 0;
                
                words.forEach(word => {
                    if (positive.includes(word)) score++;
                    if (negative.includes(word)) score--;
                });
                
                return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
            },
            
            extractKeywords(text) {
                // Simple keyword extraction
                const words = text.toLowerCase().split(/\s+/);
                const frequency = {};
                
                words.forEach(word => {
                    if (word.length > 4) {
                        frequency[word] = (frequency[word] || 0) + 1;
                    }
                });
                
                return Object.entries(frequency)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([word]) => word);
            }
        });
    }

    createDataProcessor() {
        return () => new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                try {
                    const data = typeof chunk === 'string' ? JSON.parse(chunk) : chunk;
                    
                    // Real-time data processing
                    const processed = {
                        data,
                        stats: this.calculateStats(data),
                        anomalies: this.detectAnomalies(data),
                        trends: this.identifyTrends(data),
                        timestamp: Date.now()
                    };
                    
                    callback(null, processed);
                } catch (error) {
                    callback(error);
                }
            },
            
            calculateStats(data) {
                if (Array.isArray(data)) {
                    const numbers = data.filter(d => typeof d === 'number');
                    if (numbers.length === 0) return null;
                    
                    const sum = numbers.reduce((a, b) => a + b, 0);
                    const avg = sum / numbers.length;
                    const min = Math.min(...numbers);
                    const max = Math.max(...numbers);
                    
                    return { count: numbers.length, sum, avg, min, max };
                }
                return null;
            },
            
            detectAnomalies(data) {
                if (!Array.isArray(data)) return [];
                
                const numbers = data.filter(d => typeof d === 'number');
                if (numbers.length < 3) return [];
                
                const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
                const stdDev = Math.sqrt(
                    numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length
                );
                
                return numbers
                    .map((val, idx) => ({
                        index: idx,
                        value: val,
                        zScore: (val - mean) / stdDev
                    }))
                    .filter(item => Math.abs(item.zScore) > 2);
            },
            
            identifyTrends(data) {
                if (!Array.isArray(data) || data.length < 2) return null;
                
                const numbers = data.filter(d => typeof d === 'number');
                if (numbers.length < 2) return null;
                
                const first = numbers[0];
                const last = numbers[numbers.length - 1];
                const change = last - first;
                const percentChange = (change / first) * 100;
                
                return {
                    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
                    change,
                    percentChange,
                    volatility: this.calculateVolatility(numbers)
                };
            },
            
            calculateVolatility(numbers) {
                if (numbers.length < 2) return 0;
                
                let sum = 0;
                for (let i = 1; i < numbers.length; i++) {
                    sum += Math.abs(numbers[i] - numbers[i - 1]);
                }
                
                return sum / (numbers.length - 1);
            }
        });
    }

    createEventProcessor() {
        return () => new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                try {
                    const event = typeof chunk === 'string' ? JSON.parse(chunk) : chunk;
                    
                    // Real-time event processing
                    const processed = {
                        eventId: event.id || Date.now().toString(),
                        type: event.type || 'unknown',
                        priority: this.calculatePriority(event),
                        routing: this.determineRouting(event),
                        metadata: {
                            ...event,
                            processed: Date.now(),
                            ttl: event.ttl || 3600000
                        }
                    };
                    
                    callback(null, processed);
                } catch (error) {
                    callback(error);
                }
            },
            
            calculatePriority(event) {
                // Priority calculation based on event properties
                if (event.priority) return event.priority;
                if (event.urgent || event.critical) return 'high';
                if (event.type?.includes('error')) return 'high';
                if (event.type?.includes('warning')) return 'medium';
                return 'low';
            },
            
            determineRouting(event) {
                // Determine where to route the event
                const routes = [];
                
                if (event.type?.includes('error') || event.type?.includes('alert')) {
                    routes.push('monitoring');
                }
                
                if (event.type?.includes('user') || event.type?.includes('interaction')) {
                    routes.push('analytics');
                }
                
                if (event.type?.includes('system') || event.type?.includes('performance')) {
                    routes.push('operations');
                }
                
                return routes.length > 0 ? routes : ['default'];
            }
        });
    }

    createAnalyticsProcessor() {
        return () => new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                try {
                    const data = typeof chunk === 'string' ? JSON.parse(chunk) : chunk;
                    
                    // Real-time analytics processing
                    const analytics = {
                        metrics: this.extractMetrics(data),
                        dimensions: this.extractDimensions(data),
                        aggregations: this.performAggregations(data),
                        insights: this.generateInsights(data),
                        timestamp: Date.now()
                    };
                    
                    callback(null, analytics);
                } catch (error) {
                    callback(error);
                }
            },
            
            extractMetrics(data) {
                const metrics = {};
                
                // Extract numeric values as metrics
                Object.entries(data).forEach(([key, value]) => {
                    if (typeof value === 'number') {
                        metrics[key] = value;
                    }
                });
                
                return metrics;
            },
            
            extractDimensions(data) {
                const dimensions = {};
                
                // Extract non-numeric values as dimensions
                Object.entries(data).forEach(([key, value]) => {
                    if (typeof value === 'string') {
                        dimensions[key] = value;
                    }
                });
                
                return dimensions;
            },
            
            performAggregations(data) {
                const aggregations = {};
                
                if (data.values && Array.isArray(data.values)) {
                    aggregations.count = data.values.length;
                    aggregations.sum = data.values.reduce((a, b) => a + (b || 0), 0);
                    aggregations.avg = aggregations.sum / aggregations.count;
                    aggregations.min = Math.min(...data.values);
                    aggregations.max = Math.max(...data.values);
                }
                
                return aggregations;
            },
            
            generateInsights(data) {
                const insights = [];
                
                // Generate basic insights
                if (data.trend === 'up') {
                    insights.push('Upward trend detected');
                }
                
                if (data.anomaly) {
                    insights.push('Anomaly detected in data');
                }
                
                return insights;
            }
        });
    }

    createMLProcessor() {
        return () => new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                try {
                    const data = chunk;
                    
                    // Real-time ML processing
                    const mlResult = {
                        features: this.extractFeatures(data),
                        predictions: this.makePredictions(data),
                        confidence: this.calculateConfidence(data),
                        modelInfo: {
                            type: 'real-time-ml',
                            version: '1.0',
                            lastUpdated: Date.now()
                        }
                    };
                    
                    callback(null, mlResult);
                } catch (error) {
                    callback(error);
                }
            },
            
            extractFeatures(data) {
                // Simple feature extraction
                const features = [];
                
                if (Buffer.isBuffer(data)) {
                    // Extract features from binary data
                    features.push({
                        size: data.length,
                        mean: data.reduce((a, b) => a + b, 0) / data.length,
                        variance: this.calculateVariance(data)
                    });
                } else if (typeof data === 'object') {
                    // Extract features from object
                    features.push({
                        keys: Object.keys(data).length,
                        types: Object.values(data).map(v => typeof v)
                    });
                }
                
                return features;
            },
            
            makePredictions(data) {
                // Dummy predictions for demo
                return {
                    classification: Math.random() > 0.5 ? 'positive' : 'negative',
                    probability: Math.random(),
                    alternativeClasses: ['neutral', 'unknown']
                };
            },
            
            calculateConfidence(data) {
                // Simple confidence calculation
                return 0.5 + Math.random() * 0.5;
            },
            
            calculateVariance(data) {
                const mean = data.reduce((a, b) => a + b, 0) / data.length;
                return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
            }
        });
    }

    createAnalysisPipeline(analysisType) {
        const pipelines = {
            sentiment: {
                preprocess: (text) => text.toLowerCase().replace(/[^\w\s]/g, ''),
                analyze: (text) => {
                    const positive = (text.match(/good|great|excellent|amazing/g) || []).length;
                    const negative = (text.match(/bad|terrible|awful|poor/g) || []).length;
                    return { positive, negative, neutral: text.split(' ').length - positive - negative };
                },
                postprocess: (result) => ({
                    sentiment: result.positive > result.negative ? 'positive' : 
                              result.negative > result.positive ? 'negative' : 'neutral',
                    scores: result
                })
            },
            
            frequency: {
                preprocess: (data) => Array.isArray(data) ? data : [data],
                analyze: (data) => {
                    const freq = {};
                    data.forEach(item => {
                        freq[item] = (freq[item] || 0) + 1;
                    });
                    return freq;
                },
                postprocess: (result) => ({
                    frequencies: result,
                    topItems: Object.entries(result)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                })
            },
            
            pattern: {
                preprocess: (data) => data,
                analyze: (data) => {
                    const patterns = [];
                    if (Array.isArray(data)) {
                        for (let i = 0; i < data.length - 1; i++) {
                            patterns.push([data[i], data[i + 1]]);
                        }
                    }
                    return patterns;
                },
                postprocess: (result) => ({
                    patterns: result,
                    count: result.length
                })
            }
        };
        
        return pipelines[analysisType] || pipelines.frequency;
    }

    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    async analyzeChunk(chunk, analyzer) {
        const preprocessed = analyzer.preprocess(chunk);
        const analyzed = analyzer.analyze(preprocessed);
        return analyzer.postprocess(analyzed);
    }

    summarizeAnalysis(results, analysisType) {
        const summary = {
            totalChunks: results.length,
            analysisType
        };
        
        switch (analysisType) {
            case 'sentiment':
                const sentiments = results.map(r => r.sentiment);
                summary.overall = sentiments.filter(s => s === 'positive').length > 
                                 sentiments.filter(s => s === 'negative').length ? 'positive' : 'negative';
                break;
                
            case 'frequency':
                const allFreq = {};
                results.forEach(r => {
                    Object.entries(r.frequencies).forEach(([key, val]) => {
                        allFreq[key] = (allFreq[key] || 0) + val;
                    });
                });
                summary.totalItems = Object.values(allFreq).reduce((a, b) => a + b, 0);
                summary.uniqueItems = Object.keys(allFreq).length;
                break;
                
            case 'pattern':
                summary.totalPatterns = results.reduce((sum, r) => sum + r.count, 0);
                break;
        }
        
        return summary;
    }

    registerEventHandler(eventType, action) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        
        this.eventHandlers.get(eventType).push({
            action,
            registered: Date.now()
        });
    }

    async processEvent(event) {
        const handlers = this.eventHandlers.get(event.type) || [];
        const results = [];
        
        for (const handler of handlers) {
            try {
                const result = await this.executeEventAction(handler.action, event);
                results.push({ action: handler.action, result });
            } catch (error) {
                results.push({ action: handler.action, error: error.message });
            }
        }
        
        return results;
    }

    async executeEventAction(action, event) {
        // Execute predefined actions
        const actions = {
            log: () => console.log(`Event: ${event.type}`, event),
            alert: () => ({ alert: true, message: `Alert for ${event.type}` }),
            process: () => ({ processed: true, timestamp: Date.now() }),
            forward: () => ({ forwarded: true, destination: 'analytics' }),
            transform: () => ({ ...event, transformed: true })
        };
        
        return actions[action] ? actions[action]() : { unknown_action: action };
    }

    async applyTransformation(data, transform) {
        const transformations = {
            uppercase: (d) => typeof d === 'string' ? d.toUpperCase() : d,
            lowercase: (d) => typeof d === 'string' ? d.toLowerCase() : d,
            reverse: (d) => typeof d === 'string' ? d.split('').reverse().join('') : 
                           Array.isArray(d) ? d.reverse() : d,
            double: (d) => typeof d === 'number' ? d * 2 : d,
            square: (d) => typeof d === 'number' ? d * d : d,
            filter: (d) => Array.isArray(d) ? d.filter(transform.predicate || (() => true)) : d,
            map: (d) => Array.isArray(d) ? d.map(transform.mapper || (x => x)) : d,
            reduce: (d) => Array.isArray(d) ? d.reduce(transform.reducer || ((a, b) => a + b), 0) : d
        };
        
        const transformFn = transformations[transform.type];
        if (!transformFn) {
            throw new Error(`Unknown transformation: ${transform.type}`);
        }
        
        return transformFn(data);
    }

    async defaultProcess(content, options) {
        // Default processing for unknown types
        return {
            type: 'default',
            content,
            processed: true,
            timestamp: Date.now()
        };
    }

    handleStreamData(streamId, data) {
        const stream = this.streams.get(streamId);
        if (!stream) return;
        
        stream.lastActivity = Date.now();
        stream.buffer.push(data);
        
        // Keep buffer size limited
        if (stream.buffer.length > 1000) {
            stream.buffer = stream.buffer.slice(-1000);
        }
        
        // Emit data to interested parties
        process.send({
            type: 'STREAM_DATA',
            data: {
                streamId,
                data,
                timestamp: Date.now()
            }
        });
    }

    updateMetrics(latency) {
        this.metrics.eventsProcessed++;
        
        // Update average latency (exponential moving average)
        const alpha = 0.1;
        this.metrics.averageLatency = 
            this.metrics.averageLatency * (1 - alpha) + latency * alpha;
        
        // Update throughput (events per second)
        this.metrics.throughput = this.metrics.eventsProcessed / (process.uptime() || 1);
    }

    collectMetrics() {
        // Collect real-time metrics
        const now = Date.now();
        
        this.streams.forEach((stream, streamId) => {
            const idleTime = now - stream.lastActivity;
            
            // Mark inactive streams
            if (idleTime > 300000) { // 5 minutes
                stream.inactive = true;
            }
        });
    }

    cleanupInactiveStreams() {
        const now = Date.now();
        const toRemove = [];
        
        this.streams.forEach((stream, streamId) => {
            if (stream.inactive && now - stream.lastActivity > 600000) { // 10 minutes
                toRemove.push(streamId);
            }
        });
        
        toRemove.forEach(streamId => {
            console.log(`Cleaning up inactive stream: ${streamId}`);
            this.destroyStream(streamId);
        });
    }

    reportMetrics() {
        const streamMetrics = {};
        
        this.streams.forEach((stream, streamId) => {
            streamMetrics[streamId] = {
                type: stream.type,
                processed: stream.metrics.processed,
                errors: stream.metrics.errors,
                avgLatency: stream.metrics.avgLatency,
                bufferSize: stream.buffer.length,
                inactive: stream.inactive || false
            };
        });
        
        const metrics = {
            ...this.metrics,
            streams: streamMetrics,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
        
        process.send({
            type: 'METRICS',
            data: metrics
        });
    }

    async handleInterModuleRequest(from, data, correlationId) {
        switch (data.action) {
            case 'STREAM_PROCESS':
                const result = await this.streamProcess(data.content, data.options);
                process.send({
                    type: 'INTER_MODULE_REQUEST',
                    targetModule: from,
                    action: 'STREAM_RESULT',
                    data: { result },
                    correlationId
                });
                break;
                
            case 'REAL_TIME_ANALYSIS':
                const analysis = await this.realTimeAnalysis(data.content, data.options);
                process.send({
                    type: 'INTER_MODULE_REQUEST',
                    targetModule: from,
                    action: 'ANALYSIS_RESULT',
                    data: { analysis },
                    correlationId
                });
                break;
                
            case 'CREATE_STREAM':
                this.createStream(data.config, correlationId);
                break;
        }
    }

    async shutdown() {
        console.log(`[${this.modelName}] Shutting down...`);
        
        // Destroy all streams
        this.streams.forEach((stream, streamId) => {
            this.destroyStream(streamId);
        });
        
        // Save metrics
        const finalMetrics = {
            totalProcessed: this.metrics.eventsProcessed,
            averageLatency: this.metrics.averageLatency,
            throughput: this.metrics.throughput,
            runtime: process.uptime()
        };
        
        console.log(`[${this.modelName}] Final metrics:`, finalMetrics);
        
        process.exit(0);
    }
}

// ============================================================
// INITIALIZE AND RUN
// ============================================================
const realTimeEngine = new RealTimeEngine();

// Error handlers
process.on('uncaughtException', (error) => {
    console.error(`[${realTimeEngine.modelName}] Uncaught exception:`, error);
    process.send({
        type: 'ERROR',
        data: { error: error.message, stack: error.stack }
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${realTimeEngine.modelName}] Unhandled rejection:`, reason);
});