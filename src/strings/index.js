const TesterUnavailable = tester => `No ${tester} testing available currently. The ${tester} tester is currently in-active.`;
const TestPlanUnavailable = tester => `No test plan available for the ${tester} tester. The ${tester} tester is currently in-active.`;

const TesterProgressRouteSuffix = '-tester-progress';

// Also used in the app tester.
const NowAsFileName = () => {
  const date = new Date();
  const padLeft = num => (num < 10 ? `0${num}` : `${num}`);
  return `${date.getFullYear()}-${padLeft(date.getMonth() + 1)}-${padLeft(date.getDate())}T${padLeft(date.getHours())}:${padLeft(date.getMinutes())}:${padLeft(date.getSeconds())}`;
};

module.exports = {
  TesterUnavailable,
  TestPlanUnavailable,
  TesterProgressRouteSuffix,
  NowAsFileName
};
