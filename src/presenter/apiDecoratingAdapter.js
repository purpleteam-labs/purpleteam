const config = require('config/config');
const fs = require('fs');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const request = require('request-promise-native');
const EventSource = require('eventsource');
const Model = require('src/models/model');
const dashboard = require('src/view/dashboard');
const { TesterUnavailable, TesterProgressRouteSuffix, NowAsFileName } = require('src/strings');

const ptLogger = require('purpleteam-logger');

const log = ptLogger.init(config.get('loggers.def'));
let apiResponse;

const apiUrl = config.get('purpleteamApi.url');
let accessToken;
let authUrl;
let apiStage;
let customerId;
let apiKey;

const getBuildUserConfigFile = async (filePath) => {
  try {
    const fileContents = await readFileAsync(filePath, { encoding: 'utf8' });
    return fileContents;
  } catch (err) {
    log.error(`Could not read file: ${filePath}, the error was: ${err}.`, { tags: ['apiDecoratingAdapter'] });
    throw err;
  }
};

const refreshAccessToken = async () => {
  const appClientId = config.get('purpleteamAuth.appClientId');
  const appClientSecret = config.get('purpleteamAuth.appClientSecret');
  const base64AppClientIdAndSecret = Buffer.from(`${appClientId}:${appClientSecret}`).toString('base64');
  authUrl = config.get('purpleteamAuth.url');

  await request({
    uri: authUrl,
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: { 'Content-type': 'application/x-www-form-urlencoded', Authorization: `Basic ${base64AppClientIdAndSecret}` },
    json: true
  }).then((answer) => {
    accessToken = answer.access_token;
  }).catch((err) => {
    log.crit(`Error occurred attempting to obtain access token, error was: ${err}`, { tags: ['apiDecoratingAdapter'] });
  });
};


const getOutcomesFromCloudApi = async () => {
  const outcomesFilePath = `${config.get('outcomes.filePath')}`.replace('time', NowAsFileName());
  let result;
  await request({
    uri: `${apiUrl}/${apiStage}/${customerId}/outcomes`,
    method: 'GET',
    encoding: null,
    headers: { 'x-api-key': apiKey, Authorization: `Bearer ${accessToken}` }
  }).then(async (res) => {
    await writeFileAsync(outcomesFilePath, res)
      .then(() => { result = `Outcomes have been downloaded to: ${outcomesFilePath}.`; })
      .catch((error) => { result = `Error occurred while writing the outcomes file: ${outcomesFilePath}, error was: ${error}.`; });
  }).catch(async (err) => {
    // Todo: The following will need to be tested once stage 2 containers are done in AWS.

    result = err.error.message === 'The incoming token has expired' ? async () => {
      await refreshAccessToken();
      result = await getOutcomesFromCloudApi();
    } : `Error occurred while downloading the outcomes file, error was: ${err}.`;
  });
  return result;
};


const getOutcomesFromLocalApi = async () => {
  const outcomesFilePath = `${config.get('outcomes.filePath')}`.replace('time', NowAsFileName());
  let result;
  await request({
    uri: `${apiUrl}/outcomes`,
    method: 'GET',
    encoding: null
  }).then(async (res) => {
    await writeFileAsync(outcomesFilePath, res)
      .then(() => { result = `Outcomes have been downloaded to: ${outcomesFilePath}.`; })
      .catch((error) => { result = `Error occurred while writing the outcomes file: ${outcomesFilePath}, error was: ${error}.`; });
  }).catch((err) => {
    result = `Error occurred while downloading the outcomes file, error was: ${err}.`;
  });
  return result;
};


const getOutcomesFromApi = async () => {
  await {
    cloud: getOutcomesFromCloudApi,
    local: getOutcomesFromLocalApi
  }[process.env.NODE_ENV]();
};


const postToCloudApi = async (configFileContents, route) => {
  apiStage = config.get('purpleteamApi.stage');
  customerId = config.get('purpleteamApi.customerId');
  apiKey = config.get('purpleteamApi.apiKey');

  await refreshAccessToken();

  await request({
    uri: `${apiUrl}/${apiStage}/${customerId}/${route}`,
    method: 'POST',
    json: true,
    body: configFileContents,
    headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'text/plain', charset: 'utf-8', 'x-api-key': apiKey, Authorization: `Bearer ${accessToken}` }
  }).then((answer) => {
    apiResponse = answer;
  }).catch((err) => {
    const handle = {
      errorMessageFrame: innerMessage => `Error occurred while attempting to communicate with the purpleteam Cloud API. Error was: ${innerMessage}`,
      backendTookToLong: '"The purpleteam backend took to long to respond".',
      backendUnreachable: '"The purpleteam API service is currently unreachable. Check the URL you are using".',
      validationError: `Validation of the supplied build user config failed. Errors: ${err.error.message}.`,
      syntaxError: `SyntaxError: ${err.error.message}.`,
      500: err.message,
      unknown: 'Unknown',
      testPlanFetchFailure: () => {
        if (err.message.includes('socket hang up')) return 'backendTookToLong'; // Not sure if this error is relevant?
        if (err.message.includes('getaddrinfo ENOTFOUND')) return 'backendUnreachable';
        if (err.error.name === 'ValidationError') return 'validationError';
        if (err.error.name === 'SyntaxError') return 'syntaxError';
        if (err.statusCode === 500) return '500';
        return 'unknown';
      }
    };
    log.crit(handle.errorMessageFrame(handle[handle.testPlanFetchFailure()]), { tags: ['apiDecoratingAdapter'] });
  });
};


const postToLocalApi = async (configFileContents, route) => {
  await request({
    // For debugging your request, add the below and start your http intercepting proxy (burp, zap, etc) bound to the same:
    // proxy: 'http://127.0.0.1:8080',
    uri: `${apiUrl}/${route}`,
    method: 'POST',
    json: true,
    body: configFileContents,
    headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'text/plain', charset: 'utf-8' }
  }).then((answer) => {
    apiResponse = answer;
  }).catch((err) => {
    const handle = {
      errorMessageFrame: innerMessage => `Error occurred while attempting to communicate with the purpleteam orchestrator. Error was: ${innerMessage}`,
      backendTookToLong: '"The purpleteam backend took to long to respond".',
      backendUnreachable: '"The purpleteam backend is currently unreachable".',
      validationError: `Validation of the supplied build user config failed. Errors: ${err.error.message}.`,
      syntaxError: `SyntaxError: ${err.error.message}.`,
      unknown: '"Unknown"',
      testPlanFetchFailure: () => {
        if (err.message.includes('socket hang up')) return 'backendTookToLong';
        if (err.message.includes('connect EHOSTUNREACH')) return 'backendUnreachable'; // Is 'connect EHOSTUNREACH' still correct?
        if (err.error.name === 'ValidationError') return 'validationError';
        if (err.error.name === 'SyntaxError') return 'syntaxError';
        return 'unknown';
      }
    };
    log.crit(handle.errorMessageFrame(handle[handle.testPlanFetchFailure()]), { tags: ['apiDecoratingAdapter'] });
  });
};


const postToApi = async (configFileContents, route) => {
  await {
    cloud: postToCloudApi,
    local: postToLocalApi
  }[process.env.NODE_ENV](configFileContents, route);
};


const handleServerSentTesterEvents = async (event, model, testerNameAndSession) => {
  if (event.origin === apiUrl) {
    const eventDataPropPascalCase = event.type.replace('tester', '');
    const eventDataProp = `${eventDataPropPascalCase.charAt(0).toLowerCase()}${eventDataPropPascalCase.substring(1)}`;
    let message = JSON.parse(event.data)[eventDataProp];
    if (message != null) {
      if (event.type === 'testerProgress' && message.startsWith('All test sessions of all testers are finished')) {
        message = message.concat(`\n${await getOutcomesFromApi()}`);
      }
      model.propagateTesterMessage({
        testerType: testerNameAndSession.testerType,
        sessionId: testerNameAndSession.sessionId,
        message,
        event: event.type
      });
    } else {
      log.warning(`A falsy ${event.type} event message was received from the orchestrator`, { tags: ['apiDecoratingAdapter'] });
    }
  } else {
    model.propagateTesterMessage({
      testerType: testerNameAndSession.testerType,
      sessionId: testerNameAndSession.sessionId,
      message: `Origin of event was incorrect. Actual: "${event.origin}", Expected: "${apiUrl}"`
    });
  }
};


const subscribeToTesterProgress = (model) => {
  const { testerNamesAndSessions } = model;
  testerNamesAndSessions.forEach((testerNameAndSession) => {
    // Todo: KC: Add test for the following logging.
    const loggerType = `${testerNameAndSession.testerType}-${testerNameAndSession.sessionId}`;
    const { transports, dirname } = config.get('loggers.testerProgress');
    ptLogger.add(loggerType, { transports, filename: `${dirname}${loggerType}_${NowAsFileName()}` });

    const testerRepresentative = apiResponse.find(element => element.name === testerNameAndSession.testerType);
    if (testerRepresentative) {
      model.propagateTesterMessage({
        testerType: testerNameAndSession.testerType,
        sessionId: testerNameAndSession.sessionId,
        message: testerRepresentative.message
      });
      if (testerRepresentative.message !== TesterUnavailable(testerNameAndSession.testerType)) {
        const eventSource = new EventSource(`${apiUrl}/${testerNameAndSession.testerType}-${testerNameAndSession.sessionId}${TesterProgressRouteSuffix}`);
        const handleServerSentTesterEventsClosure = (event) => {
          handleServerSentTesterEvents(event, model, testerNameAndSession);
        };
        eventSource.addEventListener('testerProgress', handleServerSentTesterEventsClosure);
        eventSource.addEventListener('testerPctComplete', handleServerSentTesterEventsClosure);
        eventSource.addEventListener('testerBugCount', handleServerSentTesterEventsClosure);
        // We may need an onerror subscription here, Let's see how it goes in alpha testing first.
      }
    } else {
      model.propagateTesterMessage({
        testerType: testerNameAndSession.testerType,
        sessionId: testerNameAndSession.sessionId,
        message: `"${testerNameAndSession.testerType}" tester for session with Id "${testerNameAndSession.sessionId}" doesn't currently appear to be online`
      });
    }
  });
};


const getTestPlans = async (configFileContents) => {
  const route = 'testplan';
  await postToApi(configFileContents, route);
  if (apiResponse) dashboard.testPlan(apiResponse);
};


const handleModelTesterEvents = (eventName, testerType, sessionId, message) => {
  dashboard[`handle${eventName.charAt(0).toUpperCase()}${eventName.substring(1)}`](testerType, sessionId, message);
  if (eventName === 'testerProgress') ptLogger.get(`${testerType}-${sessionId}`).notice(message); // Todo: this line is not tested.
};


const test = async (configFileContents) => {
  let model;
  try {
    model = new Model(configFileContents);
  } catch (error) {
    if (error.name === 'SyntaxError') throw new Error(`Syntax error in the build user config: ${error.message}`);
    throw error;
  }
  const route = 'test';
  await postToApi(configFileContents, route);

  if (apiResponse) {
    dashboard.test(model.testerSessions());
    model.eventNames.forEach((eN) => {
      model.on(eN, (testerType, sessionId, message) => { handleModelTesterEvents(eN, testerType, sessionId, message); });
    });

    subscribeToTesterProgress(model);
    // To cancel the event stream:
    //    https://github.com/mtharrison/susie#how-do-i-finish-a-sse-stream-for-good
    //    https://www.html5rocks.com/en/tutorials/eventsource/basics/#toc-canceling
    //    https://developer.mozilla.org/en-US/docs/Web/API/EventSource/close
  }
};


module.exports = {
  getBuildUserConfigFile,
  getTestPlans,
  test
};
