const TesterUnavailable = tester => `No ${tester} testing available currently. The ${tester} tester is currently in-active.`;
const TestPlanUnavailable = tester => `No test plan available for the ${tester} tester. The ${tester} tester is currently in-active.`;

module.exports = {
  TesterUnavailable,
  TestPlanUnavailable
};
