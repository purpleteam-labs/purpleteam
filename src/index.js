// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

const config = require('../config/config');
const cUiLogger = require('purpleteam-logger').init(config.get('loggers.cUi')); // eslint-disable-line import/order

const { processCommands } = require('./cli');

exports.start = async (options) => {
  cUiLogger.debug('Starting the CLI', { tags: ['index'] });
  await processCommands({ argv: options.argv });
};
