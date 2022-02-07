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

// falsy message and incorrect origin
// falsy message is logged to cUiLogger
// incorrect origin messages are dropped by eventSource

test.serial('subscribeToTesterFeedback SSE and handlers - given a mock event with falsy message or incorrect origin for each of the available testers sessions - given invocation of all the tester events - relevant handler instances should be run with correct error messages', async (t) => {
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
  const { default: ptLogger, init: initPtLogger } = await import('purpleteam-logger');
  const { default: aPi } = await import(apiDecoratingAdapterPath);

  const cUiLogger = initPtLogger(config.get('loggers.cUi'));
  const testStub = sinon.stub(view, 'test');
  const warningStub = sinon.stub(cUiLogger, 'warning');
  view.test = testStub;
  cUiLogger.warning = warningStub;

  const handleTesterProgressStub = sinon.stub(view, 'handleTesterProgress');
  view.handleTesterProgress = handleTesterProgressStub;

  new MockEvent({ // eslint-disable-line no-new
    url: `${apiUrl}/${TesterFeedbackRoutePrefix('sse')}/app/lowPrivUser`,
    setInterval: 1,
    responses: [
      { lastEventId: 'one_', type: 'testerProgress', data: '{ "progress": null }' },
      { lastEventId: 'two_', type: 'testerPctComplete', data: '{ "pctComplete": null }' },
      { lastEventId: 'three_', type: 'testerBugCount', data: '{ "bugCount": null }' }
    ]
  });
  new MockEvent({ // eslint-disable-line no-new
    url: `${apiUrl}/${TesterFeedbackRoutePrefix('sse')}/app/adminUser`,
    setInterval: 1,
    responses: [
      { lastEventId: 'four_', type: 'testerProgress', data: '{ "progress": null }' },
      { lastEventId: 'five_', type: 'testerPctComplete', data: '{ "pctComplete": null }' },
      { lastEventId: 'six_', type: 'testerBugCount', data: '{ "bugCount": null }' }
    ]
  });
  new MockEvent({ // eslint-disable-line no-new
    url: `http://devious-origin.com/${TesterFeedbackRoutePrefix('sse')}/server/NA`,
    setInterval: 1,
    responses: [
      { lastEventId: 'seven_', type: 'testerProgress', data: '{ "progress": "Initialising SSE subscription to \\"server-NA\\" channel for the event \\"testerProgress\\"" }' },
      { lastEventId: 'eight_', type: 'testerPctComplete', data: '{ "pctComplete": 1 }' },
      { lastEventId: 'nine_', type: 'testerBugCount', data: '{ "bugCount": 1 }' }
    ]
  });
  new MockEvent({ // eslint-disable-line no-new
    url: `http://devious-origin.com/${TesterFeedbackRoutePrefix('sse')}/tls/NA`,
    setInterval: 1,
    responses: [
      { lastEventId: 'ten_', type: 'testerProgress', data: '{ "progress": "Initialising SSE subscription to \\"tls-NA\\" channel for the event \\"testerProgress\\"" }' },
      { lastEventId: 'eleven_', type: 'testerPctComplete', data: '{ "pctComplete": 0 }' },
      { lastEventId: 'twelve_', type: 'testerBugCount', data: '{ "bugCount": 900 }' }
    ]
  });

  t.teardown(() => {
    nock.cleanAll();
    testStub.restore();
    cUiLogger.warning.restore();
    handleTesterProgressStub.restore();
  });

  await new Promise((resolve) => {
    const resolveIfAllWarningStubExpectationsAreComplete = () => {
      t.deepEqual(warningStub.getCall(0).args, ['A falsy testerProgress event message was received from the orchestrator', { tags: ['apiDecoratingAdapter'] }])
        && t.deepEqual(warningStub.getCall(1).args, ['A falsy testerProgress event message was received from the orchestrator', { tags: ['apiDecoratingAdapter'] }])
        && t.deepEqual(warningStub.getCall(2).args, ['A falsy testerPctComplete event message was received from the orchestrator', { tags: ['apiDecoratingAdapter'] }])
        && t.deepEqual(warningStub.getCall(3).args, ['A falsy testerPctComplete event message was received from the orchestrator', { tags: ['apiDecoratingAdapter'] }])
        && t.deepEqual(warningStub.getCall(4).args, ['A falsy testerBugCount event message was received from the orchestrator', { tags: ['apiDecoratingAdapter'] }])
        && t.deepEqual(warningStub.getCall(5).args, ['A falsy testerBugCount event message was received from the orchestrator', { tags: ['apiDecoratingAdapter'] }])
        && resolve();
    };

    const handler = {
      get(target, property, receiver) {
        if (property === 'warning') {
          return (message, tagObj) => {
            // Hit the cUiLogger warning stub (warningStub)
            target[property].call(receiver, message, tagObj);
            warningStub.callCount === 6 && resolveIfAllWarningStubExpectationsAreComplete();
          };
        }
        return (...args) => {
          target[property].call(receiver, ...args);
        };
      }
    };

    const proxyCuiLogger = new Proxy(cUiLogger, handler);

    aPi.inject({ /* Model, */ view /* , ptLogger */, cUiLogger: proxyCuiLogger, EventSource });
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

  t.is(handleTesterProgressStub.callCount, 4); // If incorrect origin messages were not dropped by eventSource, then there would be 2 more testerProgress messages.
  t.deepEqual(handleTesterProgressStub.getCall(0).args, [{ testerType: 'app', sessionId: 'lowPrivUser', message: 'Tester initialised.', ptLogger }]);
  t.deepEqual(handleTesterProgressStub.getCall(1).args, [{ testerType: 'app', sessionId: 'adminUser', message: 'Tester initialised.', ptLogger }]);
  t.deepEqual(handleTesterProgressStub.getCall(2).args, [{ testerType: 'server', sessionId: 'NA', message: 'No server testing available currently. The server tester is currently in-active.', ptLogger }]);
  t.deepEqual(handleTesterProgressStub.getCall(3).args, [{ testerType: 'tls', sessionId: 'NA', message: 'Tester initialised.', ptLogger }]);
});
