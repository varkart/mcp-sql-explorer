// Global test setup
process.env.NODE_ENV = 'test';

// Increase default timeout for container startup
if (typeof global.beforeEach === 'function') {
  global.timeout = 60000;
}
