const startXazabCore = require('../../../lib/mocha/startXazabCore');

describe('startXazabCore', () => {
  describe('One node', () => {
    let xazabCoreNode;

    startXazabCore().then((instance) => {
      xazabCoreNode = instance;
    });

    it('should have container running', async () => {
      const { State } = await xazabCoreNode.container.inspect();

      expect(State.Status).to.equal('running');
    });
  });

  describe('Many nodes', () => {
    const nodesCount = 2;

    let xazabCoreNodes;

    startXazabCore.many(nodesCount).then((instances) => {
      xazabCoreNodes = instances;
    });

    it('should have containers running', async () => {
      for (let i = 0; i < nodesCount; i++) {
        const { State } = await xazabCoreNodes[i].container.inspect();

        expect(State.Status).to.equal('running');
      }
    });
  });
});
