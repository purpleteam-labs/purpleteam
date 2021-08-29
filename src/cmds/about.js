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

  process.exit(0);
};
