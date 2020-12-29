# Xazab Platform services ctl

[![Build Status](https://travis-ci.com/xazab/js-dp-services-ctl.svg?branch=master)](https://travis-ci.com/xazab/js-dp-services-ctl)
[![NPM version](https://img.shields.io/npm/v/@xazab/dp-services-ctl.svg)](https://npmjs.org/package/@xazab/dp-services-ctl)

> Control Xazab Platform services using JavaScript and Docker

The tool provides a convenient JavaScript interface for configuration and interaction with Xazab Platform services. Services are started in Docker containers.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [Available DP services](#available-dp-services)
    - [Services configuration](#services-configuration)
    - [Integration with Mocha](#integration-with-mocha)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. [Install Docker](https://docs.docker.com/install/)
2. Install NPM package:

    ```sh
    npm install @xazab/dp-services-ctl
    ```

## Usage

### Available DP services

#### Drive

[Drive](https://github.com/xazab/drive) service starts a bunch of related services:
- DriveAbci
    - [Methods](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/drive/abci/DriveAbci.js)
    - [Options](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/drive/abci/DriveAbciOptions.js)
- [MongoDB](#mongodb)
- [Xazab Core](#xazab-core)

#### DAPI

[DAPI](https://github.com/xazab/dapi) service starts all DP services:
- DAPI Core
    - [Methods](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/dapi/core/DapiCore.js)
    - [Options](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/dapi/core/DapiCoreOptions.js)
- DAPI TxFilterStream
    - [Methods](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/dapi/txFilterStream/DapiTxFilterStream.js)
    - [Options](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/dapi/txFilterStream/DapiTxFilterStreamOptions.js)
- [Drive](#drive)
- [MongoDB](#mongodb)
- [XazabCore](#xazab-core)
- [Insight](#insight)
- [Tendermint Core](#tendermint-core)

#### Xazab Core

- [Xazab Core](https://github.com/xazab/xazab) service
    - [Methods](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/xazabCore/XazabCore.js)
    - [Options](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/xazabCore/XazabCoreOptions.js)

#### Tendermint Core

- [Tendermint Core](https://tendermint.com) service
    - [Methods](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/tendermintCore/TendermintCore.js)
    - [Options](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/tendermintCore/TendermintCoreOptions.js)

#### Insight API

- [Insight API](https://github.com/xazab/insight-api) service
    - [Methods](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/insightApi/InsightApi.js)
    - [Options](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/insightApi/InsightApiOptions.js)

#### MongoDB

- [MongoDB](https://www.mongodb.com/) service
    - [Methods](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/mongoDb/MongoDb.js)
    - [Options](https://github.com/xazab/js-dp-services-ctl/blob/master/lib/services/mongoDb/MongoDbOptions.js)

### Starting a service

```js
// Export service(s)
const { startMongoDb } = require('@xazab/dp-services-ctl');
// This is optional. Default options listed in options class
const options = {
  port: 27017, // mongoDB port
};

// Start service
const mongo = await startMongoDb(options);

// Get mongo client
const client = await mongo.getClient();

// Stop mongoDB
await mongo.remove();
```

Use `many` method to start several instances:

```js
const { startMongoDb } = require('@xazab/dp-services-ctl');

// This is optional. Default options listed in options class
const options = {
  port: 27017, // mongoDB port
};

// Start two services
const mongoNodes = await startMongoDb.many(2,options);

// Get peer IDs
const [client1, client2] = await Promise.all(
  mongoNodes.map(mongo => mongo.getClient()),
);

// Stop mongoDB nodes
await Promise.all(
  mongoNodes.map(mongo => mongo.remove()),
);
```

### Services configuration

Each service has default options which can be overwritten in three ways:
1. Pass options as plain JS object to `start[service]` or `create[service]` methods
2. Pass instance of options class to `start[service]` or `create[service]` methods
3. Pass default options as plain JS object to `setDefaultCustomOptions` method of options class

### Integration with Mocha

Services [Mocha](https://mochajs.org/) hooks provide automation for your mocha tests:
- Removing obsolete related Docker containers (`before`)
- Cleaning a service state between tests (`beforeEach`, `afterEach`)
- Stopping service after tests (`after`)

```js
// Export service(s) with mocha hooks
const { mocha: { startMongoDb } } = require('@xazab/dp-services-ctl');

describe('Test suite', () => {
  let mongoClient;

  startMongoDb().then(mongo => () => {
    mongoClient = mongo.getClient();
  });

  it('should do something', async () => {
    const collection = mongoClient.db('test').collection('syncState');
    const count = await collection.countDocuments({});

    expect(count).to.equal(0);
  });
});
```

## Maintainers

[@shumkov](https://github.com/shumkov)

[@jawid-h](https://github.com/jawid-h)

[@abvgedeika](https://github.com/abvgedeika)

## Contributing

Feel free to dive in! [Open an issue](https://github.com/xazab/js-dp-services-ctl/issues/new) or submit PRs.

## License

[MIT](LICENSE) &copy; Xazab Core Group, Inc.
