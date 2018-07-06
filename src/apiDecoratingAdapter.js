const config = require('config/config');
const readFileAsync = require('util').promisify(require('fs').readFile);
const request = require('request-promise-native');

let log;

const init = (logger) => {
  if (log) return;
  log = logger;
};

const getBuildUserConfigFile = async (filePath) => {
  try {
    const fileContents = await readFileAsync(filePath, { encoding: 'utf8' });
    log.notice(`File "${filePath}" has been hydrated`, { tags: ['apiDecoratingAdapter'] });
    return fileContents;
  } catch (err) {
    log.error(`Could not read file: ${filePath}, the error was: ${err}`, { tags: ['apiDecoratingAdapter'] });
    throw err;
  }
};

const postToApi = async (configFileContents, route, successMessage) => {
  await request({
    uri: `${config.get('purpleteamApi.url')}/${route}`,
    method: 'POST',
    json: true,
    body: configFileContents,
    headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'text/plain' }
  }).then((answer) => {
    log.notice(successMessage(answer));
  }).catch((err) => {
    const handle = {
      errorMessageFrame: innerMessage => `Error occured while attempting to retrieve your test plan. Error was: ${innerMessage}`,
      backendTookToLong: '"The purpleteam backend took to long to respond"',
      backendUnreachable: '"The purpleteam backend is currently unreachable".',
      validationError: `Validation of the supplied build user config failed: ${err.error.message}.`,
      syntaxError: `SyntaxError: ${err.error.message}.`,
      unknown: '"Unknown"',
      testPlanFetchFailure: () => {
        if (err.message.includes('socket hang up')) return 'backendTookToLong';
        if (err.message.includes('connect ECONNREFUSED')) return 'backendUnreachable';
        if (err.error.name === 'ValidationError') return 'validationError';
        if (err.error.name === 'SyntaxError') return 'syntaxError';
        return 'unknown';
      }
    };

    log.crit(handle.errorMessageFrame(handle[handle.testPlanFetchFailure()]), { tags: ['apiDecoratingAdapter'] });
  });
};

const getTestPlan = async (configFileContents) => {
  const route = 'testplan';
  const successMessage = answer => `Your test plan follows:\n${answer}`;
  await postToApi(configFileContents, route, successMessage);
};

const test = async (configFileContents) => {
  const route = 'test';
  const successMessage = answer => `Tests are executing...\n${answer}`;
  await postToApi(configFileContents, route, successMessage);
};


module.exports = {
  init,
  getBuildUserConfigFile,
  getTestPlan,
  test
};
