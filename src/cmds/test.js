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


exports.flags = 'test';
exports.description = 'Launch purpleteam to attack your specified target.';
exports.setup = (sywac) => {
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
    // Todo: KC: In the future we could deserialise configFileContents, and possibly validate before sending to the Orchestrator.
    //    https://github.com/danivek/json-api-serializer looks to be well maintained.
    //    https://github.com/SeyZ/jsonapi-serializer     looks to be a little neglected.

    await api.test(jobFileContents);

    //  stream tester log           Print each tester to a table row, and to log file
    //  stream emissary log            To artifacts dir
  } else {
    context.cliMessage('You must provide a valid Job file that exists on the local file system.');
  }
};
