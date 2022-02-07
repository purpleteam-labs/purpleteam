// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import { readFile } from 'fs/promises';
import test from 'ava';
import sinon from 'sinon';
import nock from 'nock';
import { MockEvent, EventSource } from 'mocksse';

import config from '../../config/config.js';
import { TesterFeedbackRoutePrefix } from '../../src/strings/index.js';

const apiUrl = config.get('purpleteamApi.url');
const jobFilePath = config.get('job.fileUri');
const apiDecoratingAdapterPath = '../../src/presenter/apiDecoratingAdapter.js';
const viewPath = '../../src/view/index.js';

// As stored in the `request` object body from file: /testResources/jobs/job_3.1.0-alpha.3
const expectedJob = '{\"data\":{\"type\":\"BrowserApp\",\"attributes\":{\"version\":\"3.1.0-alpha.3\",\"sutAuthentication\":{\"sitesTreeSutAuthenticationPopulationStrategy\":\"FormStandard\",\"emissaryAuthenticationStrategy\":\"FormStandard\",\"route\":\"/login\",\"usernameFieldLocater\":\"userName\",\"passwordFieldLocater\":\"password\",\"submit\":\"btn btn-danger\",\"expectedPageSourceSuccess\":\"Log Out\"},\"sutIp\":\"pt-sut-cont\",\"sutPort\":4000,\"sutProtocol\":\"http\",\"browser\":\"chrome\",\"loggedInIndicator\":\"<p>Found. Redirecting to <a href=\\\"/dashboard\\\">/dashboard</a></p>\"},\"relationships\":{\"data\":[{\"type\":\"tlsScanner\",\"id\":\"NA\"},{\"type\":\"appScanner\",\"id\":\"lowPrivUser\"},{\"type\":\"appScanner\",\"id\":\"adminUser\"}]}},\"included\":[{\"type\":\"tlsScanner\",\"id\":\"NA\",\"attributes\":{\"tlsScannerSeverity\":\"LOW\",\"alertThreshold\":3}},{\"type\":\"appScanner\",\"id\":\"lowPrivUser\",\"attributes\":{\"sitesTreePopulationStrategy\":\"WebDriverStandard\",\"spiderStrategy\":\"Standard\",\"scannersStrategy\":\"BrowserAppStandard\",\"scanningStrategy\":\"BrowserAppStandard\",\"postScanningStrategy\":\"BrowserAppStandard\",\"reportingStrategy\":\"Standard\",\"reports\":{\"templateThemes\":[{\"name\":\"traditionalHtml\"},{\"name\":\"traditionalHtmlPlusLight\"}]},\"username\":\"user1\",\"password\":\"User1_123\",\"aScannerAttackStrength\":\"HIGH\",\"aScannerAlertThreshold\":\"LOW\",\"alertThreshold\":12},\"relationships\":{\"data\":[{\"type\":\"route\",\"id\":\"/profile\"}]}},{\"type\":\"appScanner\",\"id\":\"adminUser\",\"attributes\":{\"sitesTreePopulationStrategy\":\"WebDriverStandard\",\"spiderStrategy\":\"Standard\",\"scannersStrategy\":\"BrowserAppStandard\",\"scanningStrategy\":\"BrowserAppStandard\",\"postScanningStrategy\":\"BrowserAppStandard\",\"reportingStrategy\":\"Standard\",\"username\":\"admin\",\"password\":\"Admin_123\"},\"relationships\":{\"data\":[{\"type\":\"route\",\"id\":\"/memos\"},{\"type\":\"route\",\"id\":\"/profile\"}]}},{\"type\":\"route\",\"id\":\"/profile\",\"attributes\":{\"attackFields\":[{\"name\":\"firstName\",\"value\":\"PurpleJohn\",\"visible\":true},{\"name\":\"lastName\",\"value\":\"PurpleDoe\",\"visible\":true},{\"name\":\"ssn\",\"value\":\"PurpleSSN\",\"visible\":true},{\"name\":\"dob\",\"value\":\"12235678\",\"visible\":true},{\"name\":\"bankAcc\",\"value\":\"PurpleBankAcc\",\"visible\":true},{\"name\":\"bankRouting\",\"value\":\"0198212#\",\"visible\":true},{\"name\":\"address\",\"value\":\"PurpleAddress\",\"visible\":true},{\"name\":\"website\",\"value\":\"https://purpleteam-labs.com\",\"visible\":true},{\"name\":\"_csrf\",\"value\":\"\"},{\"name\":\"submit\",\"value\":\"\"}],\"method\":\"POST\",\"submit\":\"submit\"}},{\"type\":\"route\",\"id\":\"/memos\",\"attributes\":{\"attackFields\":[{\"name\":\"memo\",\"value\":\"PurpleMemo\",\"visible\":true}],\"method\":\"POST\",\"submit\":\"btn btn-primary\"}}]}'; // eslint-disable-line no-useless-escape

test.before(async (t) => {
  t.context.jobFileContent = await readFile(jobFilePath, { encoding: 'utf8' }); // eslint-disable-line no-param-reassign
});


// Happy day test
test.serial('subscribeToTesterFeedback SSE and handlers - given a mock event for each of the available testers sessions - given invocation of all the tester events - relevant handler instances should be run', async (t) => {
  const { context: { jobFileContent } } = t;
  nock.cleanAll();
  const apiResponse = {
    testerStatuses: [
      {
        name: 'app',
        message: 'Tester initialised.'
      },
      {
        name: 'server',
        message: 'No server testing available currently. The server tester is currently in-active.'
      },
      {
        name: 'tls',
        message: 'Tester initialised.'
      }
    ],
    testerFeedbackCommsMedium: 'sse'
  };

  nock(apiUrl).post('/test', expectedJob).reply(200, apiResponse);
  const { default: view } = await import(viewPath);
  const { default: aPi } = await import(apiDecoratingAdapterPath);

  const testStub = sinon.stub(view, 'test');
  view.test = testStub;

  const viewHandlerStats = {
    testerProgress: {
      expectedCallCount: 8,
      actualCallCount: 0,
      params: [
        // Initial
        {
          matched: undefined,
          expected: { testerType: 'app', sessionId: 'lowPrivUser', message: 'Tester initialised.', ptLogger: true }
        },
        {
          matched: undefined,
          expected: { testerType: 'app', sessionId: 'adminUser', message: 'Tester initialised.', ptLogger: true }
        },
        {
          matched: undefined,
          expected: { testerType: 'server', sessionId: 'NA', message: 'No server testing available currently. The server tester is currently in-active.', ptLogger: true }
        },
        {
          matched: undefined,
          expected: { testerType: 'tls', sessionId: 'NA', message: 'Tester initialised.', ptLogger: true }
        },
        // SSE
        {
          matched: undefined,
          expected: { testerType: 'app', sessionId: 'lowPrivUser', message: 'Initialising SSE subscription to "app-lowPrivUser" channel for the event "testerProgress"', ptLogger: true }
        },
        {
          matched: undefined,
          expected: { testerType: 'app', sessionId: 'adminUser', message: 'Initialising SSE subscription to "app-adminUser" channel for the event "testerProgress"', ptLogger: true }
        },
        {
          matched: undefined,
          expected: { testerType: 'server', sessionId: 'NA', message: 'Initialising SSE subscription to "server-NA" channel for the event "testerProgress"', ptLogger: true }
        },
        {
          matched: undefined,
          expected: { testerType: 'tls', sessionId: 'NA', message: 'Initialising SSE subscription to "tls-NA" channel for the event "testerProgress"', ptLogger: true }
        }
      ]
    },
    testerPctComplete: {
      expectedCallCount: 4,
      actualCallCount: 0,
      params: [
        // SSE
        {
          matched: undefined,
          expected: { testerType: 'app', sessionId: 'lowPrivUser', message: 8 }
        },
        {
          matched: undefined,
          expected: { testerType: 'app', sessionId: 'adminUser', message: 99 }
        },
        {
          matched: undefined,
          expected: { testerType: 'server', sessionId: 'NA', message: 1 }
        },
        {
          matched: undefined,
          expected: { testerType: 'tls', sessionId: 'NA', message: 0 }
        }
      ]
    },
    testerBugCount: {
      expectedCallCount: 4,
      actualCallCount: 0,
      params: [
        // SSE
        {
          matched: undefined,
          expected: { testerType: 'app', sessionId: 'lowPrivUser', message: 3 }
        },
        {
          matched: undefined,
          expected: { testerType: 'app', sessionId: 'adminUser', message: 7 }
        },
        {
          matched: undefined,
          expected: { testerType: 'server', sessionId: 'NA', message: 1 }
        },
        {
          matched: undefined,
          expected: { testerType: 'tls', sessionId: 'NA', message: 900 }
        }
      ]
    }
  };

  new MockEvent({ // eslint-disable-line no-new
    url: `${apiUrl}/${TesterFeedbackRoutePrefix('sse')}/app/lowPrivUser`,
    setInterval: 1,
    responses: [
      { lastEventId: 'one', type: 'testerProgress', data: '{ "progress": "Initialising SSE subscription to \\"app-lowPrivUser\\" channel for the event \\"testerProgress\\"" }' },
      { lastEventId: 'two', type: 'testerPctComplete', data: '{ "pctComplete": 8 }' },
      { lastEventId: 'three', type: 'testerBugCount', data: '{ "bugCount": 3 }' }
    ]
  });
  new MockEvent({ // eslint-disable-line no-new
    url: `${apiUrl}/${TesterFeedbackRoutePrefix('sse')}/app/adminUser`,
    setInterval: 1,
    responses: [
      { lastEventId: 'four', type: 'testerProgress', data: '{ "progress": "Initialising SSE subscription to \\"app-adminUser\\" channel for the event \\"testerProgress\\"" }' },
      { lastEventId: 'five', type: 'testerPctComplete', data: '{ "pctComplete": 99 }' },
      { lastEventId: 'six', type: 'testerBugCount', data: '{ "bugCount": 7 }' }
    ]
  });
  new MockEvent({ // eslint-disable-line no-new
    url: `${apiUrl}/${TesterFeedbackRoutePrefix('sse')}/server/NA`,
    setInterval: 1,
    responses: [
      { lastEventId: 'seven', type: 'testerProgress', data: '{ "progress": "Initialising SSE subscription to \\"server-NA\\" channel for the event \\"testerProgress\\"" }' },
      { lastEventId: 'eight', type: 'testerPctComplete', data: '{ "pctComplete": 1 }' },
      { lastEventId: 'nine', type: 'testerBugCount', data: '{ "bugCount": 1 }' }
    ]
  });
  new MockEvent({ // eslint-disable-line no-new
    url: `${apiUrl}/${TesterFeedbackRoutePrefix('sse')}/tls/NA`,
    setInterval: 1,
    responses: [
      { lastEventId: 'ten', type: 'testerProgress', data: '{ "progress": "Initialising SSE subscription to \\"tls-NA\\" channel for the event \\"testerProgress\\"" }' },
      { lastEventId: 'eleven', type: 'testerPctComplete', data: '{ "pctComplete": 0 }' },
      { lastEventId: 'twelve', type: 'testerBugCount', data: '{ "bugCount": 900 }' }
    ]
  });

  t.teardown(() => {
    nock.cleanAll();
    testStub.restore();
  });

  await new Promise((resolve, reject) => {
    const resolveIfAllHandlerCallCountsAreDone = () => {
      (viewHandlerStats.testerProgress.actualCallCount === viewHandlerStats.testerProgress.expectedCallCount
        && viewHandlerStats.testerPctComplete.actualCallCount === viewHandlerStats.testerPctComplete.expectedCallCount
        && viewHandlerStats.testerBugCount.actualCallCount === viewHandlerStats.testerBugCount.expectedCallCount
        && viewHandlerStats.testerProgress.params.every((p) => p.matched)
        && viewHandlerStats.testerPctComplete.params.every((p) => p.matched)
        && viewHandlerStats.testerBugCount.params.every((p) => p.matched))
      && resolve();
    };

    const handler = {
      get(target, property, receiver) {
        if (property === 'handleTesterProgress') {
          return ({ testerType, sessionId, message, ptLogger }) => {
            viewHandlerStats.testerProgress.actualCallCount += 1;
            const matchIndex = viewHandlerStats.testerProgress.params.findIndex((p) =>
              p.expected.testerType === testerType // eslint-disable-line implicit-arrow-linebreak
                && p.expected.sessionId === sessionId
                && p.expected.message === message
                && !!ptLogger
            ); // eslint-disable-line function-paren-newline
            matchIndex < 0 && reject(new Error('An expected match was not found for the parameter set of the view\'s handleTesterProgress method.'));
            viewHandlerStats.testerProgress.params[matchIndex].matched === true && reject(new Error(`A "testerProgress" event with the same details was already matched. The parameter was: { testerType: ${testerType}, sessionId: ${sessionId}, message: ${message}, ptLogger: ${ptLogger} }`));
            viewHandlerStats.testerProgress.params[matchIndex].matched = true;
            resolveIfAllHandlerCallCountsAreDone();
          };
        }
        if (property === 'handleTesterPctComplete') {
          return ({ testerType, sessionId, message }) => {
            viewHandlerStats.testerPctComplete.actualCallCount += 1;
            const matchIndex = viewHandlerStats.testerPctComplete.params.findIndex((p) =>
              p.expected.testerType === testerType // eslint-disable-line implicit-arrow-linebreak
                && p.expected.sessionId === sessionId
                && p.expected.message === message
            ); // eslint-disable-line function-paren-newline
            matchIndex < 0 && reject(new Error('An expected match was not found for the parameter set of the view\'s handleTesterPctComplete method.'));
            viewHandlerStats.testerPctComplete.params[matchIndex].matched === true && reject(new Error('A "testerPctComplete" event with the same details was already matched.'));
            viewHandlerStats.testerPctComplete.params[matchIndex].matched = true;
            resolveIfAllHandlerCallCountsAreDone();
          };
        }
        if (property === 'handleTesterBugCount') {
          return ({ testerType, sessionId, message }) => {
            viewHandlerStats.testerBugCount.actualCallCount += 1;
            const matchIndex = viewHandlerStats.testerBugCount.params.findIndex((p) =>
              p.expected.testerType === testerType // eslint-disable-line implicit-arrow-linebreak
                && p.expected.sessionId === sessionId
                && p.expected.message === message
            ); // eslint-disable-line function-paren-newline
            matchIndex < 0 && reject(new Error('An expected match was not found for the parameter set of the view\'s handleTesterBugCount method.'));
            viewHandlerStats.testerBugCount.params[matchIndex].matched === true && reject(new Error('A "testerBugCount" event with the same details was already matched.'));
            viewHandlerStats.testerBugCount.params[matchIndex].matched = true;
            resolveIfAllHandlerCallCountsAreDone();
          };
        }
        return (...args) => {
          target[property].call(receiver, ...args);
        };
      }
    };

    const proxyView = new Proxy(view, handler);

    aPi.inject({ /* Model, */ view: proxyView, /* ptLogger, cUiLogger */ EventSource });
    aPi.test(jobFileContent);
  });

  const expectedTesterSessions = [ // Taken from the model test
    { testerType: 'app', sessionId: 'lowPrivUser', threshold: 12 },
    { testerType: 'app', sessionId: 'adminUser', threshold: 0 },
    { testerType: 'server', sessionId: 'NA', threshold: 0 },
    { testerType: 'tls', sessionId: 'NA', threshold: 3 }
  ];

  t.deepEqual(testStub.getCall(0).args[0], expectedTesterSessions);
  t.is(testStub.callCount, 1);
});


// Happy day test
/* eslint-disable */
// test.serial.only('longPollTesterFeedback LP and handlers - given a mock event for each of the available testers sessions - given invocation of all the tester events - relevant handler instances should be run', async (t) => {
//   const { context: { jobFileContent } } = t;
//   nock.cleanAll();
//   const apiResponse = {
//     testerStatuses: [
//       {
//         name: 'app',
//         message: 'Tester initialised.'
//       },
//       {
//         name: 'server',
//         message: 'No server testing available currently. The server tester is currently in-active.'
//       },
//       {
//         name: 'tls',
//         message: 'Tester initialised.'
//       }
//     ],
//     testerFeedbackCommsMedium: 'lp'
//   };

//   // allowUnmocked: true for the SSE route: /tester-feedback ......................................................
//   nock(apiUrl /* , { allowUnmocked: true } */ ).post('/test', expectedJob).reply(200, apiResponse);
//   //const { default: Model } = await import(modelPath);
//   const { default: view } = await import(viewPath);
//   const { default: ptLogger, init: initPtLogger } = await import('purpleteam-logger');
//   const { default: aPi } = await import(apiDecoratingAdapterPath);

//   //const cUiLogger = initPtLogger(config.get('loggers.cUi'));
//   const testStub = sinon.stub(view, 'test');
//   view.test = testStub;

//   //const handleTesterProgressStub = sinon.stub(view, 'handleTesterProgress');
//   //view.handleTesterProgress = handleTesterProgressStub;

//   const viewHandlerStats = {
//     testerProgress: {
//       expectedCallCount: 8,
//       actualCallCount: 0,
//       params: [
//         // Initial
//         {
//           matched: undefined,
//           expected: { testerType: 'app', sessionId: 'lowPrivUser', message: 'Tester initialised.', ptLogger: true }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'app', sessionId: 'adminUser', message: 'Tester initialised.', ptLogger: true }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'server', sessionId: 'NA', message: 'No server testing available currently. The server tester is currently in-active.', ptLogger: true }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'tls', sessionId: 'NA', message: 'Tester initialised.', ptLogger: true }
//         },
//         // SSE
//         {
//           matched: undefined,
//           expected: { testerType: 'app', sessionId: 'lowPrivUser', message: 'Initialising SSE subscription to "app-lowPrivUser" channel for the event "testerProgress"', ptLogger: true }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'app', sessionId: 'adminUser', message: 'Initialising SSE subscription to "app-adminUser" channel for the event "testerProgress"', ptLogger: true }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'server', sessionId: 'NA', message: 'Initialising SSE subscription to "server-NA" channel for the event "testerProgress"', ptLogger: true }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'tls', sessionId: 'NA', message: 'Initialising SSE subscription to "tls-NA" channel for the event "testerProgress"', ptLogger: true }
//         }
//       ]
//     },
//     testerPctComplete: {
//       expectedCallCount: 4,
//       actualCallCount: 0,
//       params: [
//         // SSE
//         {
//           matched: undefined,
//           expected: { testerType: 'app', sessionId: 'lowPrivUser', message: 8 }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'app', sessionId: 'adminUser', message: 99 }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'server', sessionId: 'NA', message: 1 }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'tls', sessionId: 'NA', message: 0 }
//         }
//       ]
//     },
//     testerBugCount: {
//       expectedCallCount: 4,
//       actualCallCount: 0,
//       params: [
//         // SSE
//         {
//           matched: undefined,
//           expected: { testerType: 'app', sessionId: 'lowPrivUser', message: 3 }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'app', sessionId: 'adminUser', message: 7 }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'server', sessionId: 'NA', message: 1 }
//         },
//         {
//           matched: undefined,
//           expected: { testerType: 'tls', sessionId: 'NA', message: 900 }
//         }
//       ]
//     }
//   };


//   nock(apiUrl)
//     .get(`/${TesterFeedbackRoutePrefix('lp')}/app/lowPrivUser`, expectedJob).reply(200, /* what do the responses look like */);
//     .get(`/${TesterFeedbackRoutePrefix('lp')}/app/adminUser`, expectedJob).reply(200, /* what do the responses look like */);
//     .get(`/${TesterFeedbackRoutePrefix('lp')}/server/NA`, expectedJob).reply(200, /* what do the responses look like */);
//     .get(`/${TesterFeedbackRoutePrefix('lp')}/tls/NA`, expectedJob).reply(200, /* what do the responses look like */);

//   // Todo: Take responses from below and massage them into the right form for above.

//   new MockEvent({ // eslint-disable-line no-new
//     url: `${apiUrl}/${TesterFeedbackRoutePrefix('lp')}/app/lowPrivUser`,
//     setInterval: 1,
//     responses: [
//       { lastEventId: 'one', type: 'testerProgress', data: '{ "progress": "Initialising SSE subscription to \\"app-lowPrivUser\\" channel for the event \\"testerProgress\\"" }' },
//       { lastEventId: 'two', type: 'testerPctComplete', data: '{ "pctComplete": 8 }' },
//       { lastEventId: 'three', type: 'testerBugCount', data: '{ "bugCount": 3 }' }
//     ]
//   });
//   new MockEvent({ // eslint-disable-line no-new
//     url: `${apiUrl}/${TesterFeedbackRoutePrefix('sse')}/app/adminUser`,
//     setInterval: 1,
//     responses: [
//       { lastEventId: 'four', type: 'testerProgress', data: '{ "progress": "Initialising SSE subscription to \\"app-adminUser\\" channel for the event \\"testerProgress\\"" }' },
//       { lastEventId: 'five', type: 'testerPctComplete', data: '{ "pctComplete": 99 }' },
//       { lastEventId: 'six', type: 'testerBugCount', data: '{ "bugCount": 7 }' }
//     ]
//   });
//   new MockEvent({ // eslint-disable-line no-new
//     url: `${apiUrl}/${TesterFeedbackRoutePrefix('sse')}/server/NA`,
//     setInterval: 1,
//     responses: [
//       { lastEventId: 'seven', type: 'testerProgress', data: '{ "progress": "Initialising SSE subscription to \\"server-NA\\" channel for the event \\"testerProgress\\"" }' },
//       { lastEventId: 'eight', type: 'testerPctComplete', data: '{ "pctComplete": 1 }' },
//       { lastEventId: 'nine', type: 'testerBugCount', data: '{ "bugCount": 1 }' }
//     ]
//   });
//   new MockEvent({ // eslint-disable-line no-new
//     url: `${apiUrl}/${TesterFeedbackRoutePrefix('sse')}/tls/NA`,
//     setInterval: 1,
//     responses: [
//       { lastEventId: 'ten', type: 'testerProgress', data: '{ "progress": "Initialising SSE subscription to \\"tls-NA\\" channel for the event \\"testerProgress\\"" }' },
//       { lastEventId: 'eleven', type: 'testerPctComplete', data: '{ "pctComplete": 0 }' },
//       { lastEventId: 'twelve', type: 'testerBugCount', data: '{ "bugCount": 900 }' }
//     ]
//   });

//   t.teardown(() => {
//     nock.cleanAll();
//     testStub.restore();
//     //handleTesterProgressStub.restore();
//   });


//   await new Promise((resolve, reject) => {

//     const resolveIfAllHandlerCallCountsAreDone = () => {
//       (viewHandlerStats.testerProgress.actualCallCount === viewHandlerStats.testerProgress.expectedCallCount
//         && viewHandlerStats.testerPctComplete.actualCallCount === viewHandlerStats.testerPctComplete.expectedCallCount
//         && viewHandlerStats.testerBugCount.actualCallCount === viewHandlerStats.testerBugCount.expectedCallCount
//         && viewHandlerStats.testerProgress.params.every((p) => p.matched)
//         && viewHandlerStats.testerPctComplete.params.every((p) => p.matched)
//         && viewHandlerStats.testerBugCount.params.every((p) => p.matched))
//       && resolve();
//     };

//     const handler = {
//       get: function(target, property) {
//         if (property === 'handleTesterProgress') {
//           return function ({ testerType, sessionId, message, ptLogger }) {
//             viewHandlerStats.testerProgress.actualCallCount += 1;
//             const matchIndex = viewHandlerStats.testerProgress.params.findIndex((p) =>
//               p.expected.testerType === testerType
//                 && p.expected.sessionId === sessionId
//                 && p.expected.message === message
//                 && !!ptLogger
//             );
//             matchIndex < 0 && reject(new Error('An expected match was not found for the parameter set of the view\'s handleTesterProgress method.'));
//             viewHandlerStats.testerProgress.params[matchIndex].matched === true && reject(new Error(`A "testerProgress" event with the same details was already matched. The parameter was: { testerType: ${testerType}, sessionId: ${sessionId}, message: ${message}, ptLogger: ${ptLogger} }`));
//             viewHandlerStats.testerProgress.params[matchIndex].matched = true;
//             resolveIfAllHandlerCallCountsAreDone();
//           };
//         }
//         if (property === 'handleTesterPctComplete') {
//           return function ({ testerType, sessionId, message }) {
//             viewHandlerStats.testerPctComplete.actualCallCount += 1;
//             const matchIndex = viewHandlerStats.testerPctComplete.params.findIndex((p) =>
//               p.expected.testerType === testerType
//                 && p.expected.sessionId === sessionId
//                 && p.expected.message === message
//             );
//             matchIndex < 0 && reject(new Error('An expected match was not found for the parameter set of the view\'s handleTesterPctComplete method.'));
//             viewHandlerStats.testerPctComplete.params[matchIndex].matched === true && reject(new Error('A "testerPctComplete" event with the same details was already matched.'));
//             viewHandlerStats.testerPctComplete.params[matchIndex].matched = true;
//             resolveIfAllHandlerCallCountsAreDone();
//           };
//         }
//         if (property === 'handleTesterBugCount') {
//           return function ({ testerType, sessionId, message }) {
//             viewHandlerStats.testerBugCount.actualCallCount += 1;
//             const matchIndex = viewHandlerStats.testerBugCount.params.findIndex((p) =>
//               p.expected.testerType === testerType
//                 && p.expected.sessionId === sessionId
//                 && p.expected.message === message
//             );
//             matchIndex < 0 && reject(new Error('An expected match was not found for the parameter set of the view\'s handleTesterBugCount method.'));
//             viewHandlerStats.testerBugCount.params[matchIndex].matched === true && reject(new Error( 'A "testerBugCount" event with the same details was already matched.'));
//             viewHandlerStats.testerBugCount.params[matchIndex].matched = true;
//             resolveIfAllHandlerCallCountsAreDone();
//           };
//         }
//         return function () {
//           target[property].apply(this, arguments);
//         };
//       }
//     };

//     const proxyView = new Proxy(view, handler);

//     aPi.inject({ /*Model,*/ view: proxyView/*, ptLogger*//*, cUiLogger, EventSource*/ });
//     aPi.test(jobFileContent);
//   });


//   const expectedTesterSessions = [ // Taken from the model test
//     { testerType: 'app', sessionId: 'lowPrivUser', threshold: 12 },
//     { testerType: 'app', sessionId: 'adminUser', threshold: 0 },
//     { testerType: 'server', sessionId: 'NA', threshold: 0 },
//     { testerType: 'tls', sessionId: 'NA', threshold: 3 }
//   ];

//   t.deepEqual(testStub.getCall(0).args[0], expectedTesterSessions);
//   t.deepEqual(testStub.callCount, 1);


// });
/* eslint-enable */
