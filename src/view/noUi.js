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

const config = require('../../config/config');
const { NowAsFileName } = require('../strings');

const handleTesterProgress = ({ testerType, sessionId, message, ptLogger }) => {
  ptLogger.get(`${testerType}-${sessionId}`).notice(message);
};

const handleTesterPctComplete = () => {
  // No UI so nothing to do.
};

const handleTesterBugCount = () => {
  // No UI so nothing to do.
};

const testPlan = ({ testPlans, ptLogger }) => {
  const { transports, dirname } = config.get('loggers.testPlan');
  testPlans.forEach((tP) => {
    // loggerThype is app or server or tls.
    const loggerType = `${tP.name}-testPlan`;
    ptLogger.add(loggerType, { transports, filename: `${dirname}${loggerType}_${NowAsFileName()}` }).notice(tP.message);
  });
};

const test = () => {
  // No UI so nothing to do.
};

const status = (cUiLogger, statusOfPurpleteamApi) => {
  cUiLogger.notice(statusOfPurpleteamApi, { tags: ['noUi'] });
};

module.exports = {
  testPlan,
  test,
  status,
  handleTesterProgress,
  handleTesterPctComplete,
  handleTesterBugCount
};

