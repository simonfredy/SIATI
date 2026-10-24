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
      instances: "max", // Menjalankan cluster mode sesuai jumlah core CPU server
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
    },
  ],
};
