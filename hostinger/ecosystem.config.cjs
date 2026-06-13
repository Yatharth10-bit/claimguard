/** PM2 process file for Hostinger VPS. Usage: pm2 start hostinger/ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: "claimguard",
      cwd: "/var/www/claimguard",
      script: "npm",
      args: "run start:hostinger",
      env: {
        NODE_ENV: "production",
        HOSTINGER: "1",
        PORT: "3000",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      time: true,
    },
  ],
};