const RpcClient = require('@xazab/xazabd-rpc/promise');

const XazabCoreOptions = require('./XazabCoreOptions');
const Network = require('../../docker/Network');
const getAwsEcrAuthorizationToken = require('../../docker/getAwsEcrAuthorizationToken');
const Image = require('../../docker/Image');
const Container = require('../../docker/Container');
const XazabCore = require('./XazabCore');

/**
 * Create Xazab Core instance
 *
 * @param {object} [opts]
 * @returns {Promise<XazabCore>}
 */
async function createXazabCore(opts) {
  const options = opts instanceof XazabCoreOptions
    ? opts
    : new XazabCoreOptions(opts);

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(networkName, driver);

  const imageName = options.getContainerImageName();

  let authorizationToken;
  if (imageName.includes('amazonaws.com')) {
    authorizationToken = await getAwsEcrAuthorizationToken(options.getAwsOptions());
  }

  const image = new Image(imageName, authorizationToken);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new XazabCore(network, image, container, RpcClient, options);
}

module.exports = createXazabCore;
