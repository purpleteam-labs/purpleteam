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

const config = require('../../config/config'); // eslint-disable-line no-unused-vars
const api = require('../presenter/apiDecoratingAdapter');


exports.flags = 'testplan';
exports.desc = 'Retrieve the test plan that will be executed when you run test.';
exports.setup = (sywac) => {
  // To override the help:
  // sywac.usage({ optionsPlaceholder: '' });
  sywac
    .option('-j, --job-file <job-file path>', {
      type: 'file',
      desc: 'Build user supplied Job file. Must be a file conforming to the Job schema.',
      mustExist: true,
      defaultValue: config.get('job.fileUri')
    })
    .check((argv, context) => {
      if (argv._.length) context.cliMessage(`Unknown argument${argv._.length > 1 ? 's' : ''}: ${argv._.join(', ')}`);
    });
};
exports.run = async (parsedArgv, context) => {
  if (parsedArgv.j) {
    const jobFileContents = await api.getJobFile(parsedArgv.j);
    await api.testPlans(jobFileContents);
  } else {
    context.cliMessage('You must provide a valid Job file that exists on the local file system.');
  }
};
