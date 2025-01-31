module.exports = {
  apps: [{
    name: "support-ticket-api",
    script: "./index.js",
    watch: true,
    instances: 1,
    autorestart: true,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "development",
      PORT: 8000
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 8000
    }
  }]
};
