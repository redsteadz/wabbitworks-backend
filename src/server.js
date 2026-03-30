const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');

const start = async () => {
  await testConnection();
  app.listen(env.port, () => {
    console.log(`API running on port ${env.port}`);
  });
};

start();
