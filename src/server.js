const createApp = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');

// Start the server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(env.port, () => {
      console.log(`   
                  Environment: ${env.nodeEnv.padEnd(45)}
                  URL: http://localhost:${env.port.toString().padEnd(39)}
                  API: http://localhost:${env.port}/api${' '.repeat(33)}
                  Docs: http://localhost:${env.port}/api/docs${' '.repeat(29)}
                  Health: http://localhost:${env.port}/api/health${' '.repeat(25)}
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('👋 Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();