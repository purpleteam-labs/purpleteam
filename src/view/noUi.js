// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

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

