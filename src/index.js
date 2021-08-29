// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of PurpleTeam.

// PurpleTeam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// PurpleTeam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this PurpleTeam project. If not, see <https://www.gnu.org/licenses/>.

const config = require('../config/config');
const cUiLogger = require('purpleteam-logger').init(config.get('loggers.cUi')); // eslint-disable-line import/order

const { processCommands } = require('./cli');

exports.start = async (options) => {
  cUiLogger.debug('Starting the CLI', { tags: ['index'] });
  await processCommands({ argv: options.argv });
};
