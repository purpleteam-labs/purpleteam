// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import { statSync } from 'fs';
import config from '../../config/config.js';
import api from '../presenter/apiDecoratingAdapter.js';

const flags = 'testplan';
const desc = 'Retrieve the test plan that will be executed when you run test.';
const setup = (sywac) => {
  // To override the help:
  // sywac.usage({ optionsPlaceholder: '' });
  sywac
    .option('-j, --job-file <job-file path>', {
      type: 'file',
      desc: 'Build user supplied Job file. Must be a file conforming to the Job schema.',
      mustExist: true,
      defaultValue: (() => {
        const jobFileUri = config.get('job.fileUri');
        const isFile = statSync(jobFileUri, { throwIfNoEntry: false })?.isFile();
        return isFile ? jobFileUri : ''; // Only an empty string will cause proper error handling.
      })()
    })
    .check((argv, context) => {
      if (argv._.length) context.cliMessage(`Unknown argument${argv._.length > 1 ? 's' : ''}: ${argv._.join(', ')}`);
    });
};
const run = async (parsedArgv, context) => {
  if (parsedArgv.j) {
    api.inject({});
    const jobFileContents = await api.getJobFile(parsedArgv.j);
    await api.testPlans(jobFileContents);
  } else {
    context.cliMessage('You must provide a valid Job file that exists on the local file system.');
  }
};

export { flags, desc, setup, run };
