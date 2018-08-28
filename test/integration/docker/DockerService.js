const Docker = require('dockerode');

const removeContainers = require('../../../lib/docker/removeContainers');
const DashCoreOptions = require('../../../lib/dashCore/DashCoreOptions');
const Network = require('../../../lib/docker/Network');
const getAwsEcrAuthorizationToken = require('../../../lib/docker/getAwsEcrAuthorizationToken');
const Image = require('../../../lib/docker/Image');
const Container = require('../../../lib/docker/Container');
const DockerService = require('../../../lib/docker/DockerService');

async function createInstance(options) {
  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const imageName = options.getContainerImageName();
  const containerOptions = options.getContainerOptions();
  const network = new Network(networkName, driver);
  const authorizationToken = await getAwsEcrAuthorizationToken(options.getAwsOptions());
  const image = new Image(imageName, authorizationToken);
  const container = new Container(networkName, imageName, containerOptions);
  return new DockerService(network, image, container, options);
}

describe('DockerService', function main() {
  this.timeout(40000);

  before(removeContainers);

  const options = new DashCoreOptions();

  describe('usage', () => {
    let instance;

    before(async () => {
      instance = await createInstance(options);
    });
    after(async () => instance.remove());

    it('should start a DockerService with DashCoreOptions network options', async () => {
      await instance.start();
      const { name, driver } = options.getContainerNetworkOptions();
      const dockerNetwork = new Docker().getNetwork(name);
      const { Driver } = await dockerNetwork.inspect();
      const { NetworkSettings: { Networks } } = await instance.container.details();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal(driver);
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal(name);
    });

    it('should start an instance with the DashCoreOptions options', async () => {
      await instance.start();
      const { Args } = await instance.container.details();
      expect(Args).to.deep.equal([
        `-port=${options.getDashdPort()}`,
        `-rpcuser=${options.getRpcUser()}`,
        `-rpcpassword=${options.getRpcPassword()}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        '-keypool=1',
        `-rpcport=${options.getRpcPort()}`,
        `-zmqpubrawtx=tcp://0.0.0.0:${options.getZmqPorts().rawtx}`,
        `-zmqpubrawtxlock=tcp://0.0.0.0:${options.getZmqPorts().rawtxlock}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${options.getZmqPorts().hashblock}`,
        `-zmqpubhashtx=tcp://0.0.0.0:${options.getZmqPorts().hashtx}`,
        `-zmqpubhashtxlock=tcp://0.0.0.0:${options.getZmqPorts().hashtxlock}`,
        `-zmqpubrawblock=tcp://0.0.0.0:${options.getZmqPorts().rawblock}`,
      ]);
    });

    it('should not crash if start is called multiple times', async () => {
      await instance.start();
      await instance.start();
    });

    it('should stop the instance', async () => {
      await instance.stop();
      const { State } = await instance.container.details();
      expect(State.Status).to.equal('exited');
    });

    it('should start after stop', async () => {
      await instance.start();
      const { State } = await instance.container.details();
      expect(State.Status).to.equal('running');
    });

    it('should return instance IP', () => {
      expect(instance.getIp()).to.be.equal(instance.getIp());
    });

    it('should clean the instance', async () => {
      await instance.remove();

      let error;
      try {
        await instance.container.details();
      } catch (err) {
        error = err;
      }
      expect(error.message).to.equal('Container not found');
    });
  });

  describe('ports', () => {
    let instanceOne;
    let instanceTwo;
    let instanceThree;
    let sandbox;

    before(async () => {
      instanceOne = await createInstance(new DashCoreOptions());
      instanceTwo = await createInstance(new DashCoreOptions());
      instanceThree = await createInstance(new DashCoreOptions());
    });
    beforeEach(function before() {
      sandbox = this.sinon;
    });
    after(async () => {
      await Promise.all([
        instanceOne.remove(),
        instanceTwo.remove(),
        instanceThree.remove(),
      ]);
    });

    it('should retry start container with another port if it is busy', async () => {
      instanceOne.container.ports = ['4444:4444'];
      instanceTwo.container.ports = ['4444:4444'];
      instanceThree.container.ports = ['4444:4444'];
      const instanceThreeSpy = sandbox.spy(instanceThree, 'start');

      await instanceOne.start();
      await instanceTwo.start();
      await instanceThree.start();

      expect(instanceThreeSpy.callCount).to.be.above(0);
    });
  });
});