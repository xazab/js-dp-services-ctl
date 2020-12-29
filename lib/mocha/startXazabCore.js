const startHelperWithMochaHooksFactory = require('./startHelperWithMochaHooksFactory');
const startXazabCore = require('../services/xazabCore/startXazabCore');

module.exports = startHelperWithMochaHooksFactory(startXazabCore);
