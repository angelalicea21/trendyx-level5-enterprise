// TrendyX AI Level 5 Enterprise Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initHeroAnimations();
    initAIComponents();
    initDemoInterface();
    initStatusDashboard();
    initScrollAnimations();
    initParticleSystem();
    initWebSocket();
    console.log('🚀 TrendyX AI Level 5 Enterprise Website Initialized');
});

// Navigation functionality
function initNavigation() {
    const navbar = document.querySelector('.header');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(15, 15, 35, 0.98)';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'rgba(15, 15, 35, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        }
    });
}

// Hero section animations
function initHeroAnimations() {
    const heroContent = document.querySelector('.hero-content');
    
    if (heroContent) {
        // Animate hero content on load
        setTimeout(() => {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 300);
        
        // Typing effect for subtitle
        const subtitle = document.querySelector('.hero .subtitle');
        if (subtitle) {
            const text = subtitle.textContent;
            subtitle.textContent = '';
            subtitle.style.opacity = '1';
            
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    subtitle.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 50);
                }
            };
            
            setTimeout(typeWriter, 1000);
        }
    }
}

// AI Components functionality
function initAIComponents() {
    const componentCards = document.querySelectorAll('.component-card');
    
    componentCards.forEach((card, index) => {
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-12px) scale(1.02)';
            this.style.boxShadow = '0 25px 50px rgba(99, 102, 241, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
        });
        
        // Animate stats
        const stats = card.querySelectorAll('.stat-value');
        stats.forEach(stat => {
            animateNumber(stat);
        });
        
        // Add quantum glow effect to quantum card
        if (card.querySelector('.quantum-icon')) {
            card.classList.add('quantum-glow');
        }
        
        // Add neural glow effect to neural card
        if (card.querySelector('.neural-icon')) {
            card.classList.add('neural-glow');
        }
    });
}

// Demo Interface functionality
function initDemoInterface() {
    const demoInput = document.querySelector('.demo-input');
    const demoOutput = document.querySelector('.demo-output');
    const demoButtons = document.querySelectorAll('.btn-primary');
    
    if (demoInput && demoOutput) {
        // Set default input
        demoInput.value = 'Analyze the potential of quantum computing in neural networks';
        
        // Demo button functionality
        demoButtons.forEach(button => {
            if (button.textContent.includes('Try Demo') || button.textContent.includes('Test AI')) {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    runAIDemo();
                });
            }
        });
        
        // Enter key to run demo
        demoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                runAIDemo();
            }
        });
    }
    
    function runAIDemo() {
        const input = demoInput.value.trim();
        if (!input) return;
        
        demoOutput.textContent = 'Processing with TrendyX AI Level 5 Enterprise...\n';
        demoOutput.classList.add('loading');
        
        // Simulate AI processing
        setTimeout(() => {
            const response = generateAIResponse(input);
            demoOutput.textContent = response;
            demoOutput.classList.remove('loading');
        }, 2000);
    }
    
    function generateAIResponse(input) {
        const responses = {
            quantum: `🌟 QUANTUM ANALYSIS COMPLETE
            
Input: "${input}"

Quantum Computing Engine Results:
✅ 64-qubit simulation initialized
✅ Grover's algorithm applied for optimization
✅ Quantum entanglement patterns detected
✅ Coherence time: 100ms, Fidelity: 99.9%

Neural Network Enhancement:
🧠 7-layer deep neural network activated
🧠 87,376 synaptic connections optimized
🧠 Quantum-enhanced learning rate: 0.001
🧠 Pattern recognition accuracy: 94.7%

Autonomous Decision:
🤖 Confidence level: 92.3%
🤖 Recommended action: Implement quantum-neural hybrid architecture
🤖 Expected performance gain: 340% over classical systems

Real-time Processing:
⚡ Processing time: 4.2ms
⚡ Throughput: 1.2M events/second
⚡ Latency optimization: 99.1% efficiency

Predictive Analytics:
🔮 Success probability: 95.8%
🔮 Risk assessment: Low
🔮 Implementation timeline: 3-6 months

Self-Healing Status:
🛡️ System integrity: 100%
🛡️ Auto-correction active
🛡️ Recovery time: <30 seconds`,
            
            default: `🚀 TRENDYX AI LEVEL 5 ANALYSIS
            
Input: "${input}"

Processing Results:
✅ Multi-layer neural analysis complete
✅ Quantum computing optimization applied
✅ Autonomous decision engine engaged
✅ Predictive modeling activated

Key Insights:
• Advanced pattern recognition detected
• Quantum enhancement factor: 3.4x
• Neural confidence score: 89.2%
• Processing efficiency: 97.8%

Recommendations:
1. Implement quantum-neural integration
2. Optimize real-time processing pipeline
3. Enable autonomous decision making
4. Deploy predictive analytics models

System Status: FULLY OPERATIONAL
Response Time: 4.7ms
Confidence Level: 91.5%`
        };
        
        if (input.toLowerCase().includes('quantum')) {
            return responses.quantum;
        }
        return responses.default;
    }
}

// Status Dashboard functionality
function initStatusDashboard() {
    const statusCards = document.querySelectorAll('.status-card');
    const metrics = document.querySelectorAll('.metric-value');
    
    // Animate status indicators
    statusCards.forEach(card => {
        const indicator = card.querySelector('.status-indicator');
        if (indicator) {
            // Random status simulation
            const statuses = ['online', 'warning', 'offline'];
            const randomStatus = statuses[Math.floor(Math.random() * 3)];
            
            if (randomStatus === 'warning') {
                indicator.classList.add('status-warning');
            } else if (randomStatus === 'offline') {
                indicator.classList.add('status-offline');
            }
        }
    });
    
    // Animate metrics
    metrics.forEach(metric => {
        animateNumber(metric);
    });
    
    // Update metrics periodically
    setInterval(updateMetrics, 5000);
}

// WebSocket connection for real-time updates
function initWebSocket() {
    try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        const socket = io(wsUrl);
        
        socket.on('connect', function() {
            console.log('🔗 Connected to TrendyX AI Level 5 Enterprise');
            updateConnectionStatus(true);
        });
        
        socket.on('disconnect', function() {
            console.log('🔌 Disconnected from TrendyX AI Level 5 Enterprise');
            updateConnectionStatus(false);
        });
        
        socket.on('system_status', function(data) {
            updateSystemStatus(data);
        });
        
        // Request status updates
        setInterval(() => {
            socket.emit('request_status');
        }, 10000);
        
    } catch (error) {
        console.log('WebSocket not available, using polling instead');
        // Fallback to HTTP polling
        setInterval(pollSystemStatus, 10000);
    }
}

// Scroll animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.component-card, .demo-container, .status-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.classList.add('animate-fade-in-up');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Particle system for background
function initParticleSystem() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    canvas.style.opacity = '0.3';
    
    document.body.appendChild(canvas);
    
    let particles = [];
    let animationId;
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        };
    }
    
    function initParticles() {
        particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push(createParticle());
        }
    }
    
    function updateParticles() {
        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        });
    }
    
    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(99, 102, 241, ${particle.opacity})`;
            ctx.fill();
        });
        
        // Draw connections
        particles.forEach((particle, i) => {
            particles.slice(i + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(otherParticle.x, otherParticle.y);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - distance / 100)})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        });
    }
    
    function animate() {
        updateParticles();
        drawParticles();
        animationId = requestAnimationFrame(animate);
    }
    
    resizeCanvas();
    initParticles();
    animate();
    
    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });
}

// Utility functions
function animateNumber(element) {
    const target = parseFloat(element.textContent);
    const isPercentage = element.textContent.includes('%');
    const suffix = isPercentage ? '%' : '';
    
    if (isNaN(target)) return;
    
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + suffix;
    }, 50);
}

function updateConnectionStatus(connected) {
    const indicators = document.querySelectorAll('.status-indicator');
    indicators.forEach(indicator => {
        if (connected) {
            indicator.classList.remove('status-offline');
            indicator.classList.add('status-online');
        } else {
            indicator.classList.remove('status-online');
            indicator.classList.add('status-offline');
        }
    });
}

function updateSystemStatus(data) {
    if (data.initialized) {
        document.body.classList.add('system-ready');
        
        // Update component status
        if (data.components) {
            Object.keys(data.components).forEach(component => {
                const card = document.querySelector(`[data-component="${component}"]`);
                if (card) {
                    const status = data.components[component];
                    updateComponentCard(card, status);
                }
            });
        }
    }
    
    // Update progress if initializing
    if (data.progress !== undefined) {
        const progressBars = document.querySelectorAll('.progress-bar');
        progressBars.forEach(bar => {
            bar.style.width = `${data.progress}%`;
        });
    }
}

function updateComponentCard(card, status) {
    const indicator = card.querySelector('.status-indicator');
    if (indicator) {
        if (status.operational) {
            indicator.classList.remove('status-offline', 'status-warning');
            indicator.classList.add('status-online');
        } else {
            indicator.classList.remove('status-online');
            indicator.classList.add('status-offline');
        }
    }
    
    // Update stats if available
    if (status.qubits) {
        const qubitStat = card.querySelector('[data-stat="qubits"]');
        if (qubitStat) qubitStat.textContent = status.qubits;
    }
    
    if (status.layers) {
        const layerStat = card.querySelector('[data-stat="layers"]');
        if (layerStat) layerStat.textContent = status.layers;
    }
}

function updateMetrics() {
    const metrics = document.querySelectorAll('.metric-value');
    metrics.forEach(metric => {
        const currentValue = parseFloat(metric.textContent);
        if (!isNaN(currentValue)) {
            // Simulate small variations
            const variation = (Math.random() - 0.5) * 0.1;
            const newValue = Math.max(0, currentValue + variation);
            metric.textContent = newValue.toFixed(1);
        }
    });
}

function pollSystemStatus() {
    fetch('/api/status')
        .then(response => response.json())
        .then(data => updateSystemStatus(data))
        .catch(error => console.log('Status polling failed:', error));
}

// Performance monitoring
function initPerformanceMonitoring() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('🚀 Page Load Performance:', {
                    loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    totalTime: perfData.loadEventEnd - perfData.fetchStart
                });
            }, 0);
        });
    }
}

// Initialize performance monitoring
initPerformanceMonitoring();

// Global error handling
window.addEventListener('error', function(e) {
    console.error('🚨 JavaScript Error:', e.error);
});

// Service worker registration (if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('🔧 Service Worker registered'))
            .catch(error => console.log('Service Worker registration failed'));
    });
}

