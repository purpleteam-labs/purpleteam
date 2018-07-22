const config = require('config/config');
const readFileAsync = require('util').promisify(require('fs').readFile);
const request = require('request-promise-native');
const EventSource = require('eventsource');

let log;

const init = (logger) => {
  if (log) return;
  log = logger;
};

const apiUrl = config.get('purpleteamApi.url');
const { app: { testerProgressRoute: appTesterProgressRoute }, server: { testerProgressRoute: serverTesterProgressRoute }, tls: { testerProgressRoute: tlsTesterProgressRoute } } = config.get('testers');


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
  let testersDeployed = false;
  await request({
    uri: `${apiUrl}/${route}`,
    method: 'POST',
    json: true,
    body: configFileContents,
    headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'text/plain' }
  }).then((answer) => {
    log.notice(successMessage(answer));
    testersDeployed = true;
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
  return testersDeployed;
};
















const subscribeToAppTesterProgress = (logger) => {
  const eventSource = new EventSource(`${apiUrl}${appTesterProgressRoute}`);  
  eventSource.addEventListener('testerProgress', (event) => {
    if (event.origin === apiUrl) {
      logger.log(JSON.parse(event.data).progress);
    } else {
      logger.log(`Origin of event was incorrect. Actual: "${event.origin}", Expected: "${apiUrl}"`);
    }
  });
};


const subscribeToServerTesterProgress = () => {
  const eventSource = new EventSource(`${apiUrl}${serverTesterProgressRoute}`);
  eventSource.addEventListener('testerProgress', (event) => {
    if (event.origin === apiUrl) {
      console.log(JSON.parse(event.data).progress);
    } else {
      console.log(`Origin of event was incorrect. Actual: "${event.origin}", Expected: "${apiUrl}"`);
    }
  });
};


const subscribeToTlsTesterProgress = () => {
  const eventSource = new EventSource(`${apiUrl}${tlsTesterProgressRoute}`);
  eventSource.addEventListener('testerProgress', (event) => {
    if (event.origin === apiUrl) {
      console.log(JSON.parse(event.data).progress);
    } else {
      console.log(`Origin of event was incorrect. Actual: "${event.origin}", Expected: "${apiUrl}"`);
    }
  });
};


const subscribeToTestersProgress = (logger) => {
  log.debug('Subscribing to progress for all testers');
  subscribeToAppTesterProgress(logger);
  subscribeToServerTesterProgress(logger);
  subscribeToTlsTesterProgress(logger);
};


const getTestPlan = async (configFileContents) => {
  const route = 'testplan';
  const successMessage = answer => `Your test plan follows:\n${answer}`;
  await postToApi(configFileContents, route, successMessage);
};

const test = async configFileContents =>
  new Promise(async (resolve, reject) => {
    const route = 'test';
    const successMessage = answer => `Tests are executing...\n${answer}`;
    const testersDeployed = await postToApi(configFileContents, route, successMessage);
    return testersDeployed ? resolve(subscribeToTestersProgress) : reject();

    // To cancel the event stream:
    //    https://github.com/mtharrison/susie#how-do-i-finish-a-sse-stream-for-good
    //    https://www.html5rocks.com/en/tutorials/eventsource/basics/#toc-canceling
  });




module.exports = {
  init,
  getBuildUserConfigFile,
  getTestPlan,
  test
};
