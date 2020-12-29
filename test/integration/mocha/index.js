/* eslint-disable global-require */
describe('Mocha', () => {
  require('./startXazabCore');
  require('./startDrive');
  require('./startMongoDb');
  require('./startDapi');
});
