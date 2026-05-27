const config = require('./config');
const app = require('./app');

const server = app.listen(config.port, () => {
  console.log(`FashionFit backend listening on port ${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    console.error('Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30000);

  server.close((err) => {
    clearTimeout(forceExitTimer);
    if (err) {
      console.error('Error while closing HTTP server:', err);
      process.exit(1);
    }
    console.log('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
