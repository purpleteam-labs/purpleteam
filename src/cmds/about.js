// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

const cUiLogger = require('purpleteam-logger').get();
const pkg = require('../../package.json');

exports.flags = 'about';
exports.desc = 'About purpleteam';
exports.setup = {};
exports.run = (/* parsedArgv, context */) => {
  const { name: projectName, version, description, homepage, author: { name, email } } = pkg;

  cUiLogger.notice(`${projectName} ${version}`, { tags: ['screen'] });
  cUiLogger.notice(description, { tags: ['screen'] });
  cUiLogger.notice(`Homepage: ${homepage}`, { tags: ['screen'] });
  cUiLogger.notice(`Created by ${name}<${email}>\n`, { tags: ['screen'] });

  cUiLogger.emerg('This is what an emergency looks like.', { tags: ['emerg-tag'] });
  cUiLogger.alert('This is what an alert looks like.', { tags: ['alert-tag'] });
  cUiLogger.crit('This is what a critical event looks like.', { tags: ['crit-tag'] });
  cUiLogger.error('This is what an error looks like.', { tags: ['error-tag'] });
  cUiLogger.warning('This is what a warning looks like.', { tags: ['warning-tag'] });
  cUiLogger.notice('This is what a notice looks like.', { tags: ['notice-tag'] });
  cUiLogger.info('This is what an info event looks like.', { tags: ['info-tag'] });
  cUiLogger.debug('This is what a debug event looks like.\n', { tags: ['debug-tag'] });

  const manPage = `Usage details for the CLI can be found on the README:
(https://github.com/purpleteam-labs/purpleteam#usage)

Installation, configuration and running details for the CLI can also be
found on the README:
(https://github.com/purpleteam-labs/purpleteam#contents).

Full documentation for the PurpleTeam SaaS can be found at:
(https://purpleteam-labs.com/doc/)`;

  console.log(`${manPage}\n`); // eslint-disable-line no-console

  process.exit(0);
};
