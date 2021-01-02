// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of purpleteam.

// purpleteam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// purpleteam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with purpleteam. If not, see <https://www.gnu.org/licenses/>.

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
const { TesterUnavailable, TesterFeedbackRoutePrefix, NowAsFileName } = require('src/strings');
const pkg = require('package.json');
const ptLogger = require('purpleteam-logger');

const log = ptLogger.init(config.get('loggers.def'));
const apiUrl = config.get('purpleteamApi.url');
const env = config.get('env');

const internals = {
  longPoll: {
    nullProgressCounter: 0,
    nullProgressMaxRetries: config.get('testerFeedbackComms.longPoll.nullProgressMaxRetries')
  },
  testerFeedbackCommsMedium: config.get('testerFeedbackComms.medium')
};

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
    cloud: { 'user-agent': `${pkg.name}/${pkg.version} ${pkg.description} ${pkg.homepage}`, 'x-api-key': config.get('purpleteamApi.apiKey') }
  }[env],
  retry: {
    limit: 2, // Default is 2
    methods: [/* Defaults */'GET', 'PUT', 'HEAD', 'OPTIONS', 'TRACE', /* Non-defaults */ 'POST'],
    statusCodes: [/* Defaults */408, 413, 429, 500, 502, 503, 504, 521, 522, 524, /* Non-defaults */ 512]
  },
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
            const optionAugmentations = { headers: { authorization: `Bearer ${await getAccessToken()}` } };
            // Save for further requests.
            gotPt.defaults.options = got.mergeOptions(gotPt.defaults.options, optionAugmentations);
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
  const { defaults: { options } } = gotPt;
  let result;
  await gotPt.get('outcomes', {
    responseType: 'buffer',
    resolveBodyOnly: true,
    retry: {
      // Outcomes file may not be ready yet, so retry
      statusCodes: [...options.retry.statusCodes, 404],
      calculateDelay: ({ attemptCount, retryOptions /* , error, computedValue */ }) => {
        if (attemptCount > retryOptions.limit) return 0;
        return attemptCount * 2000;
      }
    }
  }).then(async (response) => {
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
      const knownErrors = [
        // Server-side will catch invalid job against purpleteam schema and respond with ValidationError.
        { ValidationError: error.message }, // error.name
        // Client-side will catch invalid JSON
        { 400: `Invalid syntax in "Job" sent to the purpleteam API. Details follow:\n${error.response?.body?.message}` }, // error.response.statusCode
        { 512: error.response?.body?.message } // error.response.statusCode
        // Others?
      ];
      const knownError = knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.code))
        ?? knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.message))
        ?? knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.name))
        ?? knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.response?.statusCode))
        ?? { default: `Unknown error. Error follows: ${error}` };
      log.crit(`Error occurred while attempting to communicate with the purpleteam API. Error was: ${Object.values(knownError)[0]}`, { tags: ['apiDecoratingAdapter'] });
    }
  });
  // It appears that these need resetting:
  gotPt.defaults.options.json = undefined;
  gotPt.defaults.options.resolveBodyOnly = false;
  gotPt.defaults.options.headers['content-type'] = undefined;
  gotPt.defaults.options.headers['content-length'] = undefined;

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

const subscribeToTesterFeedback = (model, testerStatuses) => {
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
        const eventSource = new EventSource(`${apiUrl}/${TesterFeedbackRoutePrefix}/${testerNameAndSession.testerType}/${testerNameAndSession.sessionId}`);
        const handleServerSentTesterEventsClosure = (event) => {
          handleServerSentTesterEvents(event, model, testerNameAndSession);
        };
        eventSource.addEventListener('testerProgress', handleServerSentTesterEventsClosure);
        eventSource.addEventListener('testerPctComplete', handleServerSentTesterEventsClosure);
        eventSource.addEventListener('testerBugCount', handleServerSentTesterEventsClosure);
        eventSource.addEventListener('end', () => { eventSource.close(); });
        eventSource.addEventListener('error', (error) => {
          const knownErrors = [
            { 421: 'The purpleteam API is configured to use Long Polling. Make sure you have the CLI configured to use "lp"' }, // error.status
            { 400: `This could be due to a validation failure of the parameters supplied to /${TesterFeedbackRoutePrefix}/${testerNameAndSession.testerType}/${testerNameAndSession.sessionId}` } // error.status
            // Others?
          ];
          const knownError = knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.status))
            ?? { default: `Unknown error. Error follows: ${error}` };
          const errorMessage = Object.values(knownError)[0]; // eslint-disable-line prefer-destructuring
          model.propagateTesterMessage({
            testerType: testerNameAndSession.testerType,
            sessionId: testerNameAndSession.sessionId,
            message: `Error occurred while attempting to open a connection with event source from the purpleteam API. Error was: ${errorMessage}`
          });
        });
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

const handleLongPollTesterEvents = async (eventSet, model, testerNameAndSession) => {
  const { longPoll: { nullProgressMaxRetries } } = internals;
  const accumulation = await eventSet.reduce(async (accum, cV) => {
    let { keepRequestingMessages } = await accum;
    const { event: eventType } = cV;
    const eventDataPropPascalCase = eventType.replace('tester', '');
    const eventDataProp = `${eventDataPropPascalCase.charAt(0).toLowerCase()}${eventDataPropPascalCase.substring(1)}`;
    let message = cV.data[eventDataProp];
    if (message !== null) {
      internals.longPoll.nullProgressCounter = 0;
      if (eventType === 'testerProgress' && message.startsWith('Tester finished')) {
        keepRequestingMessages = false;
      }
      if (eventType === 'testerProgress' && message.startsWith('All test sessions of all testers are finished')) {
        message = message.concat(`\n${await requestOutcomes()}`);
        keepRequestingMessages = false;
      }
      model.propagateTesterMessage({
        testerType: testerNameAndSession.testerType,
        sessionId: testerNameAndSession.sessionId,
        message,
        event: eventType
      });
    } else {
      // If message === null, don't do anything. See lPTesterWatcherCallback from orchestrate.js of the orchestrator for further details.
      // If we miss the last testerProgress event we'll need to stop polling after several sequential empty `eventSet`s.
      internals.longPoll.nullProgressCounter += 1;
      keepRequestingMessages = !(internals.longPoll.nullProgressCounter >= nullProgressMaxRetries);
    }
    return { keepRequestingMessages };
  }, { keepRequestingMessages: true });
  return accumulation.keepRequestingMessages;
};

const longPollTesterFeedback = async (model, testerStatuses) => {
  const { testerNamesAndSessions } = model;
  await Promise.all(testerNamesAndSessions.map(async (testerNameAndSession) => {
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
        // If Long Polling via recursion becomes a problem due to: memory usage or stack size, we could:
        // 1. Move requestPollTesterFeedback to me module scoped in this file and call it via setTimeout
        // 2. Use EventEmitter, subscribe requestPollTesterFeedback to an event, fire the event from the gotPt callback
        const requestPollTesterFeedback = async () => {
          let keepRequestingMessages;
          await gotPt.get(`${TesterFeedbackRoutePrefix}/${testerNameAndSession.testerType}/${testerNameAndSession.sessionId}`, { responseType: 'json' }).then(async (response) => {
            keepRequestingMessages = await handleLongPollTesterEvents(response.body, model, testerNameAndSession);
            if (keepRequestingMessages) await requestPollTesterFeedback();
          }).catch((error) => {
            let errorMessage;
            if (error.processed) {
              errorMessage = error.message;
            } else {
              const knownErrors = [
                { 421: error.response?.body?.message }, // error.response.statusCode
                { ValidationError: `${error.response?.body?.name}: ${error.response?.body?.message}` } // error.response.body.name
                // Others?
              ];
              const knownError = knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.response?.statusCode))
                ?? knownErrors.find((e) => Object.prototype.hasOwnProperty.call(e, error.response?.body?.name))
                ?? { default: `Unknown error. Error follows: ${error}` };
              errorMessage = Object.values(knownError)[0]; // eslint-disable-line prefer-destructuring
            }
            model.propagateTesterMessage({
              testerType: testerNameAndSession.testerType,
              sessionId: testerNameAndSession.sessionId,
              message: `Error occurred while attempting to Poll the purpleteam API for tester feedback. Error was: ${errorMessage}`
            });
          });
        };
        await requestPollTesterFeedback();
      }
    } else {
      model.propagateTesterMessage({
        testerType: testerNameAndSession.testerType,
        sessionId: testerNameAndSession.sessionId,
        message: `"${testerNameAndSession.testerType}" tester for session with Id "${testerNameAndSession.sessionId}" doesn't currently appear to be online`
      });
    }
  }));
};

/* eslint-disable max-classes-per-file */
// Context.
class TesterFeedbackComms {
  constructor() {
    this.testerFeedbackCommsMedium = internals[internals.testerFeedbackCommsMedium];
    return this;
  }

  async getTesterFeedback(model, testerStatuses) {
    await this.testerFeedbackCommsMedium.getTesterFeedback(model, testerStatuses);
  }
}
// Concrete Strategy.
internals.sse = {
  getTesterFeedback: (model, testerStatuses) => {
    subscribeToTesterFeedback(model, testerStatuses);
  }
};
// Concrete Strategy.
internals.lp = {
  getTesterFeedback: async (model, testerStatuses) => {
    await longPollTesterFeedback(model, testerStatuses);
  }
};
/* eslint-enable max-classes-per-file */


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

    await new TesterFeedbackComms().getTesterFeedback(model, testerStatuses);

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
