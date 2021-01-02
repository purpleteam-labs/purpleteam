// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of purpleteam.

// purpleteam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// purpleteam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with purpleteam. If not, see <https://www.gnu.org/licenses/>.

const config = require('config/config'); // eslint-disable-line no-unused-vars
const api = require('src/presenter/apiDecoratingAdapter');


exports.flags = 'testplan';
exports.desc = 'Retrieve the test plan that will be executed when you run test.';
exports.setup = (sywac) => {
  // To override the help:
  // sywac.usage({ optionsPlaceholder: '' });
  sywac
    .option('-c, --config-file <config-file path>', {
      type: 'file',
      desc: 'Build user supplied configuration file. Must be a file conforming to the schema defined in the purpleteam documentation.',
      mustExist: true,
      defaultValue: config.get('buildUserConfig.fileUri')
    })
    .check((argv, context) => {
      if (argv._.length) context.cliMessage(`Unknown argument${argv._.length > 1 ? 's' : ''}: ${argv._.join(', ')}`);
    });
};
exports.run = async (parsedArgv, context) => {
  if (parsedArgv.c) {
    const configFileContents = await api.getBuildUserConfigFile(parsedArgv.c);
    await api.testPlans(configFileContents);
  } else {
    context.cliMessage('You must provide a valid build user configuration file that exists on the local file system.');
  }
};
