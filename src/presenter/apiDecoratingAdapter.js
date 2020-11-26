const config = require('config/config');
const fs = require('fs');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const got = require('got');
const EventSource = require('eventsource');
const Bourne = require('@hapi/bourne');
const Model = require('src/models/model');
const dashboard = require('src/view/dashboard');
const { TesterUnavailable, TesterProgressRoutePrefix, NowAsFileName } = require('src/strings');
const pkg = require('package.json');
const ptLogger = require('purpleteam-logger');

const log = ptLogger.init(config.get('loggers.def'));
const apiUrl = config.get('purpleteamApi.url');
const env = config.get('env');

const getBuildUserConfigFile = async (filePath) => {
  try {
    const fileContents = await readFileAsync(filePath, { encoding: 'utf8' });
    return fileContents;
  } catch (err) {
    log.error(`Could not read file: ${filePath}, the error was: ${err}.`, { tags: ['apiDecoratingAdapter'] });
    throw err;
  }
};

const gotCloudAuth = got.extend({
  prefixUrl: config.get('purpleteamAuth.url'),
  body: 'grant_type=client_credentials',
  responseType: 'json',
  resolveBodyOnly: true,
  headers: {
    'user-agent': `${pkg.name}/${pkg.version} ${pkg.description} ${pkg.homepage}`,
    'Content-type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${(() => Buffer.from(`${config.get('purpleteamAuth.appClientId')}:${config.get('purpleteamAuth.appClientSecret')}`).toString('base64'))()}`
  }
});

const getAccessToken = async () => {
  let accessToken;
  await gotCloudAuth.post().then((response) => {
    accessToken = response.access_token;
  }).catch((error) => {
    const knownErrors = [
      { ENOTFOUND: 'The authorisation service appears to be down, or an incorrect URL has been specified in the CLI config.' }, // error.code
      { 'Response code 400 (Bad Request)': 'The authorisation service responded with 400 (Bad Request). This could be because your authentication details are incorrect.' } // error.message
    ];
    const knownError = knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.code))
      ?? knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.message))
      ?? { default: `An unknown error occurred while attempting to get the access token. Error follows: ${error}` };
    log.crit(Object.values(knownError)[0], { tags: ['apiDecoratingAdapter'] });
  });
  return accessToken;
};

/* eslint-disable no-param-reassign */
const gotPt = got.extend({
  prefixUrl: { local: `${apiUrl}/`, cloud: `${apiUrl}/${config.get('purpleteamApi.stage')}/${config.get('purpleteamApi.customerId')}/` }[env],
  headers: {
    local: { 'user-agent': `${pkg.name}/${pkg.version} ${pkg.description} ${pkg.homepage}` },
    cloud: { 'user-agent': `${pkg.name}/${pkg.version} ${pkg.description} ${pkg.homepage}`, 'x-api-key': config.get('purpleteamApi.apiKey') /* , Authorization: `Bearer ${await getAccessToken()}` */ }
  }[env],
  hooks: {
    beforeRequest: {
      local: [],
      cloud: [
        async (options) => {
          if (!Object.prototype.hasOwnProperty.call(options.headers, 'authorization')) {
            options.headers.authorization = `Bearer ${await getAccessToken()}`;
            // Save for further requests.
            gotPt.defaults.options = got.mergeOptions(gotPt.defaults.options, options);
          }
        }
      ]
    }[env],
    afterResponse: {
      local: [],
      cloud: [
        // We use this function for custom retry logic.
        async (response, retryWithMergedOptions) => {
          if (response.statusCode === 401 || response.statusCode === 403) { // Unauthorised or Forbidden
            const updatedOptions = { headers: { authorization: `Bearer ${await getAccessToken()}` } };
            // Save for further requests.
            gotPt.defaults.options = got.mergeOptions(gotPt.defaults.options, updatedOptions);
            // Make a new retry
            return retryWithMergedOptions(gotPt.defaults.options);
          }
          return response;
        }
      ]
    }[env],
    beforeError: {
      local: [
        (error) => {
          const knownErrors = [
            { EHOSTUNREACH: 'orchestrator is down, or an incorrect URL has been specified in the CLI config.' } // error.code
            // Others?
          ];
          const knownError = knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.code));
          if (knownError) {
            error.processed = true;
            const [message] = Object.values(knownError);
            error.message = message;
          }
          return error;
        }
      ],
      cloud: [
        (error) => {
          const knownErrors = [
            { 'Response code 500 (Internal Server Error)': 'purpleteam Cloud API responded with "orchestrator is down".' }, // error.message
            { ENOTFOUND: 'purpleteam Cloud API is down, or an incorrect URL has been specified in the CLI config.' }, // error.code
            { 'Response code 401 (Unauthorized)': 'You are not authorised to access the purpleteam Cloud API.' }, // error.message
            { 'Response code 504 (Gateway Timeout)': 'purpleteam Cloud API responded with "gateway timeout".' } // error.message
          ];
          const knownError = knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.code))
            ?? knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.message));
          if (knownError) {
            error.processed = true;
            const [message] = Object.values(knownError);
            error.message = message;
          }
          return error;
        }
      ]
    }[env]
  },
  mutableDefaults: true
});
/* eslint-enable no-param-reassign */

const requestStatus = async () => {
  await gotPt.get('status').then((response) => {
    dashboard.status(log, response.body);
  }).catch((error) => {
    dashboard.status(log, error.processed ? error.message : `An unknown error occurred while attempting to get the status. Error follows: ${error}`);
  });
};

const requestOutcomes = async () => {
  const outcomesFilePath = `${config.get('outcomes.filePath')}`.replace('time', NowAsFileName());
  let result;
  await gotPt.get('outcomes', { responseType: 'buffer', resolveBodyOnly: true }).then(async (response) => {
    await writeFileAsync(outcomesFilePath, response)
      .then(() => { result = `Outcomes have been downloaded to: ${outcomesFilePath}.`; })
      .catch((error) => { result = `Error occurred while writing the outcomes file: ${outcomesFilePath}, error was: ${error}.`; });
  }).catch((error) => {
    // Errors not tested.
    result = `Error occurred while downloading the outcomes file, error was: ${error.processed ? error.message : error}.`;
  });
  return result;
};

const requestTestOrTestPlan = async (configFileContents, route) => {
  let result;
  await gotPt.post(`${route}`, { headers: { 'Content-Type': 'application/vnd.api+json' }, json: configFileContents, responseType: 'json', resolveBodyOnly: true }).then((response) => {
    result = response;
  }).catch((error) => {
    if (error.processed) {
      log.crit(error.message, { tags: ['apiDecoratingAdapter'] });
    } else {
      // Find out what these errors look like and set-up correctly...
      const knownErrors = [
        { ValidationError: `${error.message}` }, // error.name . Not sure if we still get this one.
        // Client-side will catch invalid JSON, server-side will also catch invalid Job against purpleteam schema.
        // At time of writing, the errors array contains a single element with all errors, if that changes to multiple elements, the below logic will still work.
        { 400: `Invalid syntax in "Job" sent to the purpleteam API. Details follow:\n${error.response?.body?.message}` } // error.response.statusCode
        // { 400: `Invalid syntax in "Job" sent to the purpleteam API. Details follow:\n${error.response?.body?.errors?.reduce((acum, cV) => `${acum}\n${cV.detail}`, '')}` }
        // Others?
      ];
      const knownError = knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.code))
        ?? knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.message))
        ?? knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.name))
        ?? knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.response?.statusCode))
        ?? { default: `Unknown error. Error follows: ${error}` };
      log.crit(`Error occurred while attempting to communicate with the purpleteam API. Error was: ${Object.values(knownError)[0]}`, { tags: ['apiDecoratingAdapter'] });
      console.log(Object.values(knownError)[0]); // eslint-disable-line
    }
  });
  return result;
};
const requestTest = async (configFileContents) => requestTestOrTestPlan(configFileContents, 'test');
const requestTestPlan = async (configFileContents) => requestTestOrTestPlan(configFileContents, 'testplan');

const handleServerSentTesterEvents = async (event, model, testerNameAndSession) => {
  if (event.origin === apiUrl) {
    const eventDataPropPascalCase = event.type.replace('tester', '');
    const eventDataProp = `${eventDataPropPascalCase.charAt(0).toLowerCase()}${eventDataPropPascalCase.substring(1)}`;
    let message = Bourne.parse(event.data)[eventDataProp];
    if (message != null) {
      if (event.type === 'testerProgress' && message.startsWith('All test sessions of all testers are finished')) {
        message = message.concat(`\n${await requestOutcomes()}`);
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

const subscribeToTesterProgress = (model, testerStatuses) => {
  const { testerNamesAndSessions } = model;
  testerNamesAndSessions.forEach((testerNameAndSession) => {
    // Todo: KC: Add test for the following logging.
    const loggerType = `${testerNameAndSession.testerType}-${testerNameAndSession.sessionId}`;
    const { transports, dirname } = config.get('loggers.testerProgress');
    ptLogger.add(loggerType, { transports, filename: `${dirname}${loggerType}_${NowAsFileName()}` });

    const testerRepresentative = testerStatuses.find((element) => element.name === testerNameAndSession.testerType);
    if (testerRepresentative) {
      model.propagateTesterMessage({
        testerType: testerNameAndSession.testerType,
        sessionId: testerNameAndSession.sessionId,
        message: testerRepresentative.message
      });
      if (testerRepresentative.message !== TesterUnavailable(testerNameAndSession.testerType)) {
        const eventSource = new EventSource(`${apiUrl}/${TesterProgressRoutePrefix}/${testerNameAndSession.testerType}/${testerNameAndSession.sessionId}`);
        // Todo: Cloud currently broken. AWS API Gateway doesn't support SSE. Convert cloud to long polling.
        // This request works:
        //   `${apiUrl}/${apiStage}/${customerId}/${TesterProgressRoutePrefix}/${testerNameAndSession.testerType}/${testerNameAndSession.sessionId}`,
        //   { headers: { 'x-api-key': apiKey, Authorization: `Bearer ${accessToken}` } }
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

const getInitialisedModel = (configFileContents) => {
  let model;
  try {
    model = new Model(configFileContents);
  } catch (error) {
    if (error.name === 'SyntaxError') {
      log.crit(`Invalid syntax in "Job": ${error.message}`, { tags: ['apiDecoratingAdapter'] });
      return undefined;
    }
    throw error;
  }
  return model;
};

const testPlans = async (configFileContents) => {
  if (!getInitialisedModel(configFileContents)) return;
  const resultingTestPlans = await requestTestPlan(configFileContents);
  resultingTestPlans && dashboard.testPlan(resultingTestPlans);
};

const handleModelTesterEvents = (eventName, testerType, sessionId, message) => {
  dashboard[`handle${eventName.charAt(0).toUpperCase()}${eventName.substring(1)}`](testerType, sessionId, message);
  if (eventName === 'testerProgress') ptLogger.get(`${testerType}-${sessionId}`).notice(message);
};

const test = async (configFileContents) => {
  const model = getInitialisedModel(configFileContents);
  if (!model) return;
  const testerStatuses = await requestTest(configFileContents);

  if (testerStatuses) {
    dashboard.test(model.testerSessions());
    model.eventNames.forEach((eN) => {
      model.on(eN, (testerType, sessionId, message) => { handleModelTesterEvents(eN, testerType, sessionId, message); });
    });

    subscribeToTesterProgress(model, testerStatuses);
    // To cancel the event stream:
    //    https://github.com/mtharrison/susie#how-do-i-finish-a-sse-stream-for-good
    //    https://www.html5rocks.com/en/tutorials/eventsource/basics/#toc-canceling
    //    https://developer.mozilla.org/en-US/docs/Web/API/EventSource/close
  }
};

const status = async () => { await requestStatus(); };

module.exports = {
  getBuildUserConfigFile,
  testPlans,
  test,
  status
};
