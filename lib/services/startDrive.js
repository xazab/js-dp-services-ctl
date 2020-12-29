const createMongoDb = require('./mongoDb/createMongoDb');
const startXazabCore = require('./xazabCore/startXazabCore');
const createDriveAbci = require('./drive/abci/createDriveAbci');

async function callInParallel(services, method) {
  const instances = [
    services.xazabCore,
    services.mongoDb,
    services.driveAbci,
  ];
  const promises = instances.map(instance => instance[method]());
  await Promise.all(promises);
}

/**
 * @typedef Drive
 * @property {XazabCore} xazabCore
 * @property {MongoDb} mongoDb
 * @property {DriveAbci} driveAbci
 * @property {Promise<>} clean
 * @property {Promise<>} remove
 * @property {Promise<>} connect
 */

/**
 * Create Drive instance
 *
 * @param {object} [options]
 * @returns {Promise<Drive>}
 */
async function startDrive(options) {
  const instances = await startDrive.many(1, options);
  return instances[0];
}

/**
 * Create Drive instances
 *
 * @param {Number} number
 * @param {object} [options]
 * @returns {Promise<Drive[]>}
 */
startDrive.many = async function many(number, options = {}) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  const xazabCoreInstances = await startXazabCore.many(number, options.xazabCore);

  for (let i = 0; i < number; i++) {
    const xazabCoreInstance = xazabCoreInstances[i];
    const mongoDbInstance = await createMongoDb(options.mongoDb);
    await mongoDbInstance.start();

    const envs = [
      `CORE_ZMQ_PUB_HASHBLOCK=${xazabCoreInstance.getZmqSockets().hashblock}`,
      `CORE_JSON_RPC_HOST=${xazabCoreInstance.getIp()}`,
      `CORE_JSON_RPC_PORT=${xazabCoreInstance.options.getRpcPort()}`,
      `CORE_JSON_RPC_USERNAME=${xazabCoreInstance.options.getRpcUser()}`,
      `CORE_JSON_RPC_PASSWORD=${xazabCoreInstance.options.getRpcPassword()}`,
      `DOCUMENT_MONGODB_URL=mongodb://${mongoDbInstance.getIp()}:${mongoDbInstance.options.getMongoPort()}`,
    ];
    const driveOptions = { ...options.drive };
    driveOptions.container = driveOptions.container || {};
    driveOptions.container.envs = driveOptions.container.envs || [];
    driveOptions.container.envs = driveOptions.container.envs.concat(envs);

    const driveAbciInstance = await createDriveAbci(driveOptions);
    await driveAbciInstance.start();

    const instance = {
      xazabCore: xazabCoreInstance,
      mongoDb: mongoDbInstance,
      driveAbci: driveAbciInstance,
      clean: async function clean() {
        await callInParallel(instance, 'clean');
      },
      remove: async function clean() {
        await callInParallel(instance, 'remove');
      },
      connect: async function connect(otherInstance) {
        await Promise.all([
          instance.xazabCore.connect(otherInstance.xazabCore),
          instance.mongoDb.connect(otherInstance.mongoDb),
          instance.driveAbci.connect(otherInstance.driveAbci),
        ]);
      },
    };

    instances.push(instance);
  }

  return instances;
};

module.exports = startDrive;
