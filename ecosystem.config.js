// ============================================================
// PM2 ECOSYSTEM CONFIGURATION
// This helps manage all our robot friends in production!
// ============================================================

module.exports = {
  apps: [
    {
      // Main Application
      name: 'trendyx-ai-level5',
      script: './server.js',
      instances: process.env.CLUSTER_WORKERS || 4,
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000
      },
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced options
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      autorestart: true,
      
      // Watching
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'data',
        'uploads',
        'exports',
        '.git',
        '*.log'
      ],
      
      // Process management
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: true,
      
      // Monitoring
      instance_var: 'INSTANCE_ID',
      merge_logs: true,
      
      // Node.js arguments
      node_args: '--max-old-space-size=1024',
      
      // Source map support
      source_map_support: true,
      
      // Graceful reload
      shutdown_with_message: true
    },
    
    {
      // Health Monitor (runs separately)
      name: 'trendyx-health-monitor',
      script: './scripts/health-monitor.js',
      instances: 1,
      exec_mode: 'fork',
      
      env: {
        NODE_ENV: 'production',
        MONITOR_INTERVAL: 30000
      },
      
      error_file: './logs/health-monitor-error.log',
      out_file: './logs/health-monitor-out.log',
      
      max_memory_restart: '256M',
      autorestart: true,
      watch: false,
      
      // Don't start by default
      // Uncomment to enable health monitoring
      // min_uptime: '10s',
      // max_restarts: 5
    },
    
    {
      // Metrics Collector (optional)
      name: 'trendyx-metrics',
      script: './scripts/metrics-collector.js',
      instances: 1,
      exec_mode: 'fork',
      
      env: {
        NODE_ENV: 'production',
        COLLECT_INTERVAL: 60000,
        METRICS_PORT: 9090
      },
      
      error_file: './logs/metrics-error.log',
      out_file: './logs/metrics-out.log',
      
      max_memory_restart: '128M',
      autorestart: true,
      watch: false,
      
      // Don't start by default
      // Uncomment to enable metrics collection
      // min_uptime: '10s',
      // max_restarts: 3
    }
  ],
  
  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/trendyx-ai-level5.git',
      path: '/var/www/trendyx-ai',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    },
    
    staging: {
      user: 'deploy',
      host: 'staging.your-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/trendyx-ai-level5.git',
      path: '/var/www/trendyx-ai-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};

// ============================================================
// PM2 USAGE INSTRUCTIONS
// ============================================================
/*

🚀 STARTING THE APPLICATION:

  Development:
    pm2 start ecosystem.config.js

  Production:
    pm2 start ecosystem.config.js --env production

  With custom worker count:
    CLUSTER_WORKERS=8 pm2 start ecosystem.config.js

📊 MONITORING:

  View all processes:
    pm2 list

  Monitor in real-time:
    pm2 monit

  View logs:
    pm2 logs
    pm2 logs trendyx-ai-level5
    pm2 logs --lines 100

  View detailed info:
    pm2 info trendyx-ai-level5

📈 METRICS:

  Show process metrics:
    pm2 show trendyx-ai-level5

  Web dashboard:
    pm2 web

🔄 MANAGEMENT:

  Restart:
    pm2 restart trendyx-ai-level5

  Reload (zero-downtime):
    pm2 reload trendyx-ai-level5

  Stop:
    pm2 stop trendyx-ai-level5

  Delete:
    pm2 delete trendyx-ai-level5

  Scale workers:
    pm2 scale trendyx-ai-level5 8

💾 PERSISTENCE:

  Save current process list:
    pm2 save

  Resurrect saved processes:
    pm2 resurrect

  Setup startup script:
    pm2 startup
    pm2 save

🚢 DEPLOYMENT:

  Deploy to production:
    pm2 deploy production setup
    pm2 deploy production

  Deploy to staging:
    pm2 deploy staging

  Update deployment:
    pm2 deploy production update

  Revert deployment:
    pm2 deploy production revert 1

📝 USEFUL COMMANDS:

  Flush logs:
    pm2 flush

  Reset restart counters:
    pm2 reset trendyx-ai-level5

  Update PM2:
    pm2 update

  Kill PM2 daemon:
    pm2 kill

🔧 ECOSYSTEM FILE EXPLAINED:

  - instances: Number of worker processes (use 'max' for all CPU cores)
  - exec_mode: 'cluster' for multiple instances, 'fork' for single
  - max_memory_restart: Auto-restart if memory exceeds this
  - watch: Auto-restart on file changes (disable in production)
  - env: Environment variables for different environments
  - deploy: Deployment configurations for different environments

*/