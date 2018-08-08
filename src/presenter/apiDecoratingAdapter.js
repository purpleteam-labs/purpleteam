const config = require('config/config');
const readFileAsync = require('util').promisify(require('fs').readFile);
const request = require('request-promise-native');
const EventSource = require('eventsource');
const Model = require('src/models/model');
const dashboard = require('src/view/dashboard');
const { TesterUnavailable, TestPlanUnavailable, TesterProgressRouteSuffix } = require('src/strings');

let log;
let apiResponse;
let model;

const init = (logger) => {
  if (log) return;
  log = logger;
};

const apiUrl = config.get('purpleteamApi.url');
//const testersConfig = config.get('testers');


const getBuildUserConfigFile = async (filePath) => {
  try {
    const fileContents = await readFileAsync(filePath, { encoding: 'utf8' });    
    return fileContents;
  } catch (err) {
    log.error(`Could not read file: ${filePath}, the error was: ${err}`, { tags: ['apiDecoratingAdapter'] });
    throw err;
  }
};


const postToApi = async (configFileContents, route) => {  
  await request({
    uri: `${apiUrl}/${route}`,
    method: 'POST',
    json: true,
    body: configFileContents,
    headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'text/plain' }
  }).then((answer) => {
    apiResponse = answer;
  }).catch((err) => {
    const handle = {
      errorMessageFrame: innerMessage => `Error occured while attempting to communicate with the purpleteam SaaS. Error was: ${innerMessage}`,
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


const receiveTestPlan = (logger) => {
  const loggerName = logger.options.name;
  const testerRepresentative = apiResponse.find(element => element.name === loggerName);

  if (testerRepresentative) {
    logger.log(testerRepresentative.message);
  } else {
    logger.log(`${loggerName} tester doesn't currently appear to be online`);
  }
};


const subscribeToTesterProgress = () => {
  const { testerNamesAndSessions } = model;

  testerNamesAndSessions().forEach((testerNameAndSession) => {
    const testerRepresentative = apiResponse.find(element => element.name === testerNameAndSession.testerType);
    if (testerRepresentative) {
      model.propagateTesterMessage({ testerType: testerNameAndSession.testerType, sessionId: testerNameAndSession.sessionId, message: testerRepresentative.message });
      if (testerRepresentative.message !== TesterUnavailable(testerNameAndSession.testerType)) {
        const eventSource = new EventSource(`${apiUrl}/${testerNameAndSession.testerType}-${testerNameAndSession.sessionId}${TesterProgressRouteSuffix}`);

        eventSource.addEventListener('testerProgress', (event) => {
          if (event.origin === apiUrl) {
            const message = JSON.parse(event.data).progress;
            if (message != null) model.propagateTesterMessage({ testerType: testerNameAndSession.testerType, sessionId: testerNameAndSession.sessionId, message, event: 'testerProgress' });
            else log.warning('A falsy testerProgress event message was received from the orchestrator', { tags: ['apiDecoratingAdapter'] });
          } else {
            model.propagateTesterMessage({ testerType: testerNameAndSession.testerType, sessionId: testerNameAndSession.sessionId, message: `Origin of event was incorrect. Actual: "${event.origin}", Expected: "${apiUrl}"` });
          }
        });

        eventSource.addEventListener('testerPctComplete', (event) => {
          if (event.origin === apiUrl) {
            const message = JSON.parse(event.data).pctComplete;
            if (message != null) model.propagateTesterMessage({ testerType: testerNameAndSession.testerType, sessionId: testerNameAndSession.sessionId, message, event: 'testerPctComplete' });
            else log.warning('A falsy testerPctComplete event message was received from the orchestrator', { tags: ['apiDecoratingAdapter'] });
          } else {
            model.propagateTesterMessage({ testerType: testerNameAndSession.testerType, sessionId: testerNameAndSession.sessionId, message: `Origin of event was incorrect. Actual: "${event.origin}", Expected: "${apiUrl}"` });
          }
        });

        eventSource.addEventListener('testerBugCount', (event) => {
          if (event.origin === apiUrl) {
            const message = JSON.parse(event.data).bugCount;
            if (message != null) model.propagateTesterMessage({ testerType: testerNameAndSession.testerType, sessionId: testerNameAndSession.sessionId, message, event: 'testerBugCount' });
            else log.warning('A falsy testerBugCount event message was received from the orchestrator', { tags: ['apiDecoratingAdapter'] });
          } else {
            model.propagateTesterMessage({ testerType: testerNameAndSession.testerType, sessionId: testerNameAndSession.sessionId, message: `Origin of event was incorrect. Actual: "${event.origin}", Expected: "${apiUrl}"` });
          }
        });
        // Todo: KC: Here we'll need to listen for the end event. When it arrives, we need to fetch the testerProgress logs, test results, and reports.
      }
    } else {
      model.propagateTesterMessage({
        testerType: testerNameAndSession.testerType,
        sessionId: testerNameAndSession.testerType,
        message: `"${testerNameAndSession.testerType}" tester for session with Id "${testerNameAndSession.sessionId}" doesn't currently appear to be online`
      });
    }
  });
};


const getTestPlans = async configFileContents =>
  new Promise(async (resolve, reject) => {
    const route = 'testplan';

    await postToApi(configFileContents, route);

    return apiResponse ? resolve(receiveTestPlan) : reject();
  });


const test = async (configFileContents) => {
  debugger;  
  model = new Model(configFileContents);
  const route = 'test';  
  await postToApi(configFileContents, route);

  if (apiResponse) {
    dashboard.test(model.testerSessions());
    model.eventNames().forEach((eN) => {
      model.on(eN, (testerType, sessionId, message) => {
        dashboard[`handle${eN.charAt(0).toUpperCase()}${eN.substring(1)}`](testerType, sessionId, message);
      });
    });
    
    subscribeToTesterProgress();
    // To cancel the event stream:
    //    https://github.com/mtharrison/susie#how-do-i-finish-a-sse-stream-for-good
    //    https://www.html5rocks.com/en/tutorials/eventsource/basics/#toc-canceling
  } else {
    log.crit('There didn\'t appear to be a response from the purpleteam API', { tags: ['apiDecoratingAdapter'] });
  }
  
  
};


module.exports = {
  init,
  getBuildUserConfigFile,
  getTestPlans,
  test
};
