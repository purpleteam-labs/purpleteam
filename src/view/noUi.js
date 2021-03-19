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

