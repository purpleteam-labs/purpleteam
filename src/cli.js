// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import sywac from 'sywac';
import chalk from 'chalk';
import figlet from 'figlet';
import { get as getLogger } from 'purpleteam-logger';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { name: pkgName, description: pkgDescription } = require('../package');

const epilogue = `For more information, find the manual at https://doc.purpleteam-labs.com
Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.
Use of this source code is governed by a license that can be found in the LICENSE.md file.`;

const processCommands = async (options) => { // eslint-disable-line no-unused-vars
  const cUiLogger = getLogger();
  cUiLogger.debug('Configuring sywac\n', { tags: ['cli'] });
  const api = sywac; // eslint-disable-line no-unused-vars
  api.usage('Usage: $0 [command] [option(s)]');
  await api.commandDirectory(path.join(dirname(fileURLToPath(import.meta.url)), 'cmds'));
  // This overrides the --help and --version and adds their aliases
  api.showHelpByDefault()
    .version('-v, --version', { desc: 'Show version number' })
    .help('-h, --help')
    .preface(figlet.textSync(pkgName, 'Chunky'), chalk.bgHex('#9961ed')(pkgDescription))
    .epilogue(epilogue)
    .style({
      // usagePrefix: str => chalk.hex('#9961ed').bold(str),
      flags: (str) => chalk.bold(str),
      group: (str) => chalk.hex('#9961ed').bold(str),
      messages: (str) => chalk.hex('#FFA500').bold(str)
    });

  // Introduced this function due to https://github.com/sywac/sywac/issues/25
  const shouldParseAndexit = (argv) => {
    const command = argv[2];
    const arg = argv[3];
    return argv.length < 3
      || command === 'about'
      || command === '-v' || command === '--version'
      || command === '-h' || command === '--help'
      || (command !== 'test' && command !== 'testplan' && command !== 'status')
      || (command === 'test' && !!arg) || (command === 'testplan' && !!arg) || (command === 'status' && !!arg);
  };

  const cliArgs = shouldParseAndexit(options.argv) ? await api.parseAndExit() : await api.parse();

  // api.parse needs a short-circut for errors.
  // Unexpected errors are included in cliArgs.errors
  typeof cliArgs.errors !== 'undefined' && cliArgs.errors.length && cUiLogger.error(cliArgs.errors) && process.exit(cliArgs.code);
  // a non-zero cliArgs.code value means at least one validation or unexpected error occurred
  // Doc: https://sywac.io/docs/async-parsing.html
  cliArgs.code > 0 && cUiLogger.warning(cliArgs.output) && process.exit(cliArgs.code);
};

export default processCommands;
