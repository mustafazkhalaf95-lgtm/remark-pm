// ═══════════════════════════════════════════════════════════════
// Remark PM — PM2 Ecosystem Configuration
// ═══════════════════════════════════════════════════════════════

module.exports = {
  apps: [
    {
      name: 'remark-pm',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/remark-pm',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/www/remark-pm/logs/err.log',
      out_file: '/var/www/remark-pm/logs/out.log',
      log_file: '/var/www/remark-pm/logs/combined.log',
      time: true,
    },
  ],
};
