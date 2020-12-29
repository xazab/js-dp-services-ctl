const removeContainers = require('../../../../lib/docker/removeContainers');
const { startXazabCore } = require('../../../../lib');

const wait = require('../../../../lib/util/wait');

describe('startXazabCore', function main() {
  this.timeout(60000);

  before(removeContainers);

  describe('One node', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let xazabCoreNode;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = { container };

      xazabCoreNode = await startXazabCore(options);
    });

    after(async () => xazabCoreNode.remove());

    it('should have container running', async () => {
      const { State, Mounts } = await xazabCoreNode.container.inspect();

      expect(State.Status).to.equal('running');
      expect(Mounts.map(mount => mount.Destination)).to.include(CONTAINER_VOLUME);
    });

    it('should have RPC connected', async () => {
      const { result } = await xazabCoreNode.rpcClient.getInfo();

      expect(result).to.have.property('version');
    });
  });

  describe('Many nodes', () => {
    const nodesCount = 2;
    const CONTAINER_VOLUME = '/usr/src/app/README.md';

    let xazabCoreNodes;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = { container };

      xazabCoreNodes = await startXazabCore.many(nodesCount, options);
    });

    after(async () => {
      await Promise.all(
        xazabCoreNodes.map(instance => instance.remove()),
      );
    });

    it('should have containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await xazabCoreNodes[i].container.inspect();

        expect(State.Status).to.equal('running');
        expect(Mounts.map(mount => mount.Destination)).to.include(CONTAINER_VOLUME);
      }
    });

    it('should propagate blocks between nodes', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { result: blocks } = await xazabCoreNodes[i].rpcClient.getBlockCount();

        expect(blocks).to.equal(1);
      }

      const { result: address } = await xazabCoreNodes[0].rpcClient.getNewAddress();
      await xazabCoreNodes[0].rpcClient.generateToAddress(2, address);

      await wait(5000);

      for (let i = 0; i < nodesCount; i++) {
        const { result: blocks } = await xazabCoreNodes[i].rpcClient.getBlockCount();

        expect(blocks).to.equal(3);
      }
    });
  });
});
