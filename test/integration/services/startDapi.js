const removeContainers = require('../../../lib/docker/removeContainers');
const { startDapi } = require('../../../lib');

describe('startDapi', function main() {
  this.timeout(180000);

  before(removeContainers);

  describe('One node', () => {
    const CONTAINER_VOLUME = '/usr/src/app/README.md';
    let dapiNode;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = {
        xazabCore: { container },
        drive: { container },
      };

      dapiNode = await startDapi(options);
    });

    after(async () => dapiNode.remove());

    it('should have XazabCore container running', async () => {
      const { State } = await dapiNode.xazabCore.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have MongoDb container running', async () => {
      const { State } = await dapiNode.mongoDb.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have Insight API container running', async () => {
      const { State } = await dapiNode.insightApi.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have DAPI Core container running', async () => {
      const { State } = await dapiNode.dapiCore.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have DAPI TxFilterStream container running', async () => {
      const { State } = await dapiNode.dapiTxFilterStream.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have Drive ABCI container running', async () => {
      const { State } = await dapiNode.driveAbci.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should have Tendermint Core container running', async () => {
      const { State } = await dapiNode.tendermintCore.container.inspect();

      expect(State.Status).to.equal('running');
    });

    it('should DAPI Core container has the right env variables', async () => {
      const { Config: { Env: envs } } = await dapiNode.dapiCore.container.inspect();
      const expectedEnv = [
        `INSIGHT_URI=http://${dapiNode.insightApi.getIp()}:${dapiNode.insightApi.options.getApiPort()}/insight-api`,
        `XAZABCORE_RPC_HOST=${dapiNode.xazabCore.getIp()}`,
        `XAZABCORE_RPC_PORT=${dapiNode.xazabCore.options.getRpcPort()}`,
        `XAZABCORE_RPC_USER=${dapiNode.xazabCore.options.getRpcUser()}`,
        `XAZABCORE_RPC_PASS=${dapiNode.xazabCore.options.getRpcPassword()}`,
        `XAZABCORE_ZMQ_HOST=${dapiNode.xazabCore.getIp()}`,
        `XAZABCORE_ZMQ_PORT=${dapiNode.xazabCore.options.getZmqPorts().rawtxlock}`, // hashblock, hashtx, hashtxlock, rawblock, rawtx, rawtxlock
        `XAZABCORE_P2P_HOST=${dapiNode.xazabCore.getIp()}`,
        `XAZABCORE_P2P_PORT=${dapiNode.xazabCore.options.getXazabdPort()}`,
        'XAZABCORE_P2P_NETWORK=regtest',
        'NETWORK=regtest',
        'TENDERMINT_RPC_HOST=node0',
        `TENDERMINT_RPC_PORT=${dapiNode.tendermintCore.options.getTendermintPort()}`,
      ];

      const dapiEnvs = envs.filter(variable => expectedEnv.indexOf(variable) !== -1);

      expect(dapiEnvs.length).to.equal(expectedEnv.length);
    });

    it('should DAPI TxFilterStream container has the right env variables', async () => {
      const { Config: { Env: envs } } = await dapiNode.dapiTxFilterStream.container.inspect();
      const expectedEnv = [
        `INSIGHT_URI=http://${dapiNode.insightApi.getIp()}:${dapiNode.insightApi.options.getApiPort()}/insight-api`,
        `XAZABCORE_RPC_HOST=${dapiNode.xazabCore.getIp()}`,
        `XAZABCORE_RPC_PORT=${dapiNode.xazabCore.options.getRpcPort()}`,
        `XAZABCORE_RPC_USER=${dapiNode.xazabCore.options.getRpcUser()}`,
        `XAZABCORE_RPC_PASS=${dapiNode.xazabCore.options.getRpcPassword()}`,
        `XAZABCORE_ZMQ_HOST=${dapiNode.xazabCore.getIp()}`,
        `XAZABCORE_ZMQ_PORT=${dapiNode.xazabCore.options.getZmqPorts().rawtxlock}`, // hashblock, hashtx, hashtxlock, rawblock, rawtx, rawtxlock
        `XAZABCORE_P2P_HOST=${dapiNode.xazabCore.getIp()}`,
        `XAZABCORE_P2P_PORT=${dapiNode.xazabCore.options.getXazabdPort()}`,
        'XAZABCORE_P2P_NETWORK=regtest',
        'NETWORK=regtest',
        'TENDERMINT_RPC_HOST=node0',
        `TENDERMINT_RPC_PORT=${dapiNode.tendermintCore.options.getTendermintPort()}`,
      ];

      const dapiEnvs = envs.filter(variable => expectedEnv.indexOf(variable) !== -1);

      expect(dapiEnvs.length).to.equal(expectedEnv.length);
    });

    it('should be on the same network: XazabCore, Drive, MongoDb, Insight API, Machine, Tendermint Core and UpdateState', async () => {
      const {
        NetworkSettings: xazabCoreNetworkSettings,
      } = await dapiNode.xazabCore.container.inspect();

      const {
        NetworkSettings: driveAbciNetworkSettings,
      } = await dapiNode.driveAbci.container.inspect();

      const {
        NetworkSettings: mongoDbNetworkSettings,
      } = await dapiNode.mongoDb.container.inspect();

      const {
        NetworkSettings: insightNetworkSettings,
      } = await dapiNode.insightApi.container.inspect();

      const {
        NetworkSettings: dapiCoreNetworkSettings,
      } = await dapiNode.dapiCore.container.inspect();

      const {
        NetworkSettings: dapiTxFilterStreamNetworkSettings,
      } = await dapiNode.dapiTxFilterStream.container.inspect();

      const {
        NetworkSettings: tendermintCoreNetworkSettings,
      } = await dapiNode.tendermintCore.container.inspect();

      expect(Object.keys(xazabCoreNetworkSettings.Networks)).to.deep.equal(['xazab_test_network']);
      expect(Object.keys(driveAbciNetworkSettings.Networks)).to.deep.equal(['xazab_test_network']);
      expect(Object.keys(mongoDbNetworkSettings.Networks)).to.deep.equal(['xazab_test_network']);
      expect(Object.keys(insightNetworkSettings.Networks)).to.deep.equal(['xazab_test_network']);
      expect(Object.keys(dapiCoreNetworkSettings.Networks)).to.deep.equal(['xazab_test_network']);
      expect(Object.keys(dapiTxFilterStreamNetworkSettings.Networks)).to.deep.equal(['xazab_test_network']);
      expect(Object.keys(tendermintCoreNetworkSettings.Networks)).to.deep.equal(['xazab_test_network']);
    });
  });

  describe.skip('Many nodes', () => {
    const nodesCount = 2;
    const CONTAINER_VOLUME = '/usr/src/app/README.md';

    let dapiNodes;

    before(async () => {
      const rootPath = process.cwd();
      const container = {
        volumes: [
          `${rootPath}/README.md:${CONTAINER_VOLUME}`,
        ],
      };
      const options = {
        xazabCore: { container },
        drive: { container },
      };

      dapiNodes = await startDapi.many(nodesCount, options);
    });

    after(async () => {
      await Promise.all(
        dapiNodes.map(instance => instance.remove()),
      );
    });

    it('should have XazabCore containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].xazabCore.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].mongoDb.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have Drive ABCI containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State, Mounts } = await dapiNodes[i].driveAbci.container.inspect();

        expect(State.Status).to.equal('running');
        expect(Mounts.map(mount => mount.Destination)).to.include(CONTAINER_VOLUME);
      }
    });

    it('should have Insight containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].insightApi.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have DAPI Core containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].dapiCore.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });

    it('should have DAPI TxFilterStream containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await dapiNodes[i].dapiTxFilterStream.container.inspect();

        expect(State.Status).to.equal('running');
      }
    });
  });
});
