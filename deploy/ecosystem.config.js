// ==============================================================================
// KONFIGURASI PM2 PRODUCTION UNTUK SIATI (Next.js Application)
// Jalankan dengan: pm2 start deploy/ecosystem.config.js
// ==============================================================================

module.exports = {
  apps: [
    {
      name: "siati-app",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./",
      instances: 1, // 1 Instance menjamin in-memory event emitter (SSE) sinkron untuk seluruh pengguna
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_ENV: "production",
      },
    },
  ],
};
