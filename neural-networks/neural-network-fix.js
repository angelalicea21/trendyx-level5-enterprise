// neural-network-fix.js - Prevents Map size exceeded error
// This wrapper limits neural connections to prevent memory overflow

class NeuralNetworkLimiter {
    static MAX_SYNAPSES = 100000; // JavaScript Map limit
    static SAFE_CONNECTIONS = 2048; // Safe limit for Railway
    
    static limitConnections(connections) {
        if (connections > this.SAFE_CONNECTIONS) {
            console.warn(`⚠️ Limiting neural connections from ${connections} to ${this.SAFE_CONNECTIONS}`);
            return this.SAFE_CONNECTIONS;
        }
        return connections;
    }
    
    static patchAdvancedNeuralOrchestrator() {
        try {
            const AdvancedNeuralOrchestrator = require('./advanced_neural_orchestrator');
            
            // Override the constructor
            const OriginalConstructor = AdvancedNeuralOrchestrator;
            
            AdvancedNeuralOrchestrator.prototype.initializeNetwork = function() {
                console.log('🧠 Initializing Neural Network with safety limits...');
                
                // Limit the network size
                const safeLayerSize = Math.floor(Math.sqrt(NeuralNetworkLimiter.SAFE_CONNECTIONS));
                this.layers = Math.min(this.layers || 6, 4);
                this.neuronsPerLayer = Math.min(this.neuronsPerLayer || 128, safeLayerSize);
                
                // Create limited synapses
                this.synapses = new Map();
                let synapseCount = 0;
                const maxSynapses = NeuralNetworkLimiter.SAFE_CONNECTIONS;
                
                for (let i = 0; i < this.layers - 1 && synapseCount < maxSynapses; i++) {
                    for (let j = 0; j < this.neuronsPerLayer && synapseCount < maxSynapses; j++) {
                        for (let k = 0; k < this.neuronsPerLayer && synapseCount < maxSynapses; k++) {
                            if (Math.random() > 0.3) { // 70% connection probability
                                const synapseId = `L${i}N${j}-L${i+1}N${k}`;
                                this.synapses.set(synapseId, {
                                    weight: (Math.random() - 0.5) * 2,
                                    bias: (Math.random() - 0.5) * 0.1
                                });
                                synapseCount++;
                            }
                        }
                    }
                }
                
                console.log(`✅ Neural Network initialized with ${synapseCount} synapses (safe limit)`);
            };
            
            console.log('✅ Advanced Neural Orchestrator patched with safety limits');
            return AdvancedNeuralOrchestrator;
            
        } catch (error) {
            console.error('Failed to patch Advanced Neural Orchestrator:', error);
            // Return a dummy class if patching fails
            return class DummyNeuralOrchestrator {
                constructor() {
                    console.log('Using dummy neural orchestrator (safety mode)');
                    this.synapses = new Map();
                }
                process(input) {
                    return { output: input, confidence: 0.5 };
                }
            };
        }
    }
}

module.exports = NeuralNetworkLimiter;