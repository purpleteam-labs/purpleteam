// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import { readFile } from 'fs/promises';
import test from 'ava';
import sinon from 'sinon';
import nock from 'nock';
import { EventSource } from 'mocksse';

import config from '../../config/config.js';

const apiUrl = config.get('purpleteamApi.url');
const jobFilePath = config.get('job.fileUri');
const apiDecoratingAdapterPath = '../../src/presenter/apiDecoratingAdapter.js';
const viewPath = '../../src/view/index.js';

// As stored in the `request` object body from file: /testResources/jobs/job_4.0.0-alpha.3
const expectedJob = '{\"data\":{\"type\":\"BrowserApp\",\"attributes\":{\"version\":\"4.0.0-alpha.3\",\"sutAuthentication\":{\"sitesTreeSutAuthenticationPopulationStrategy\":\"FormStandard\",\"emissaryAuthenticationStrategy\":\"FormStandard\",\"route\":\"/login\",\"usernameFieldLocater\":\"userName\",\"passwordFieldLocater\":\"password\",\"submit\":\"btn btn-danger\",\"expectedPageSourceSuccess\":\"Log Out\"},\"sutIp\":\"pt-sut-cont\",\"sutPort\":4000,\"sutProtocol\":\"http\",\"browser\":\"chrome\",\"loggedInIndicator\":\"<p>Found. Redirecting to <a href=\\\"/dashboard\\\">/dashboard</a></p>\"},\"relationships\":{\"data\":[{\"type\":\"tlsScanner\",\"id\":\"NA\"},{\"type\":\"appScanner\",\"id\":\"lowPrivUser\"},{\"type\":\"appScanner\",\"id\":\"adminUser\"}]}},\"included\":[{\"type\":\"tlsScanner\",\"id\":\"NA\",\"attributes\":{\"tlsScannerSeverity\":\"LOW\",\"alertThreshold\":3}},{\"type\":\"appScanner\",\"id\":\"lowPrivUser\",\"attributes\":{\"sitesTreePopulationStrategy\":\"WebDriverStandard\",\"spiderStrategy\":\"Standard\",\"scannersStrategy\":\"BrowserAppStandard\",\"scanningStrategy\":\"BrowserAppStandard\",\"postScanningStrategy\":\"BrowserAppStandard\",\"reportingStrategy\":\"Standard\",\"reports\":{\"templateThemes\":[{\"name\":\"traditionalHtml\"},{\"name\":\"traditionalHtmlPlusLight\"}]},\"username\":\"user1\",\"password\":\"User1_123\",\"aScannerAttackStrength\":\"HIGH\",\"aScannerAlertThreshold\":\"LOW\",\"alertThreshold\":12},\"relationships\":{\"data\":[{\"type\":\"route\",\"id\":\"/profile\"}]}},{\"type\":\"appScanner\",\"id\":\"adminUser\",\"attributes\":{\"sitesTreePopulationStrategy\":\"WebDriverStandard\",\"spiderStrategy\":\"Standard\",\"scannersStrategy\":\"BrowserAppStandard\",\"scanningStrategy\":\"BrowserAppStandard\",\"postScanningStrategy\":\"BrowserAppStandard\",\"reportingStrategy\":\"Standard\",\"username\":\"admin\",\"password\":\"Admin_123\"},\"relationships\":{\"data\":[{\"type\":\"route\",\"id\":\"/memos\"},{\"type\":\"route\",\"id\":\"/profile\"}]}},{\"type\":\"route\",\"id\":\"/profile\",\"attributes\":{\"attackFields\":[{\"name\":\"firstName\",\"value\":\"PurpleJohn\",\"visible\":true},{\"name\":\"lastName\",\"value\":\"PurpleDoe\",\"visible\":true},{\"name\":\"ssn\",\"value\":\"PurpleSSN\",\"visible\":true},{\"name\":\"dob\",\"value\":\"12235678\",\"visible\":true},{\"name\":\"bankAcc\",\"value\":\"PurpleBankAcc\",\"visible\":true},{\"name\":\"bankRouting\",\"value\":\"0198212#\",\"visible\":true},{\"name\":\"address\",\"value\":\"PurpleAddress\",\"visible\":true},{\"name\":\"website\",\"value\":\"https://purpleteam-labs.com\",\"visible\":true},{\"name\":\"_csrf\",\"value\":\"\"},{\"name\":\"submit\",\"value\":\"\"}],\"method\":\"POST\",\"submit\":\"submit\"}},{\"type\":\"route\",\"id\":\"/memos\",\"attributes\":{\"attackFields\":[{\"name\":\"memo\",\"value\":\"PurpleMemo\",\"visible\":true}],\"method\":\"POST\",\"submit\":\"btn btn-primary\"}}]}'; // eslint-disable-line no-useless-escape

test.before(async (t) => {
  /* eslint-disable no-param-reassign */
  t.context.jobFileContent = await readFile(jobFilePath, { encoding: 'utf8' });
  t.context.jobFileContentLocalMissingComma = await readFile(`${process.cwd()}/testResources/jobs/job_4.0.0-alpha.3_local_missing_comma`, { encoding: 'utf8' });
  t.context.jobFileContentLocalMissingTypeOfAppScanner = await readFile(`${process.cwd()}/testResources/jobs/job_4.0.0-alpha.3_local_missing_type_of_appScanner`, { encoding: 'utf8' });
  /* eslint-enable no-param-reassign */
});

test.serial('testPlans - Should provide the cUi with the test plan to display', async (t) => {
  const { context: { jobFileContent } } = t;

  const expectedArgPasssedToTestPlan = [{
    name: 'app',
    message: `@app_scan
    Feature: Web application free of security vulnerabilities known to the Emissary
    
    # Before hooks are run before Background
    
    Background:
      Given a new Test Session based on each Build User supplied appScanner resourceObject
      And the Emissary sites tree is populated with each Build User supplied route of each appScanner resourceObject
      And the Emissary authentication is configured for the SUT
      And the application is spidered for each appScanner resourceObject
    
    Scenario: The application should not contain vulnerabilities known to the Emissary that exceed the Build User defined threshold
      Given the active scanners are configured
      When the active scan is run
      Then the vulnerability count should not exceed the Build User defined threshold of vulnerabilities known to the Emissary
    
    
    
    @simple_math
    Feature: Simple maths
      In order to do maths
      As a developer
      I want to increment variables
    
      Scenario: easy maths
        Given a variable set to 1
        When I increment the variable by 1
        Then the variable should contain 2
    
      Scenario Outline: much more complex stuff
        Given a variable set to <var>
        When I increment the variable by <increment>
        Then the variable should contain <result>
    
        Examples:
          | var | increment | result |
          | 100 |         5 |    105 |
          |  99 |      1234 |   1333 |
          |  12 |         5 |     17 |
    
    `
  }, {
    name: 'server',
    message: 'No test plan available for the server tester. The server tester is currently in-active.'
  }, {
    name: 'tls',
    message: `@tls_scan
    Feature: Web application free of TLS vulnerabilities known to the TLS Emissary
    
    # Before hooks are run before Background
    # Todo update app_scan.feature and docs around tester session wording
    Background:
      Given a new TLS Test Session based on the Build User supplied tlsScanner resourceObject
    
    Scenario: The application should not contain vulnerabilities known to the TLS Emissary that exceed the Build User defined threshold
      Given the TLS Emissary is run with arguments
      Then the vulnerability count should not exceed the Build User defined threshold of vulnerabilities known to the TLS Emissary
    
      `
  }];

  nock(apiUrl).post('/testplan', expectedJob).reply(200, expectedArgPasssedToTestPlan);
  const { default: view } = await import(viewPath);
  const { default: ptLogger /* , init: initPtLogger */ } = await import('purpleteam-logger');
  const { default: aPi } = await import(apiDecoratingAdapterPath);

  const testPlanStub = sinon.stub(view, 'testPlan');
  view.testPlan = testPlanStub;

  t.teardown(() => {
    nock.cleanAll();
    testPlanStub.restore();
  });

  aPi.inject({ /* Model, */ view /* , ptLogger, cUiLogger: initPtLogger(config.get('loggers.cUi')) */ });

  await aPi.testPlans(jobFileContent);

  t.deepEqual(testPlanStub.getCall(0).args[0], { testPlans: expectedArgPasssedToTestPlan, ptLogger });
});

test.serial('postToApi - on - connect EHOSTUNREACH - should print message - orchestrator is down...', async (t) => {
  const { context: { jobFileContent } } = t;

  nock(apiUrl).post('/testplan', expectedJob).replyWithError({ code: 'EHOSTUNREACH' });
  const { /* default: ptLogger, */ init: initPtLogger } = await import('purpleteam-logger');
  const { default: aPi } = await import(apiDecoratingAdapterPath);

  const cUiLogger = initPtLogger(config.get('loggers.cUi'));
  const critStub = sinon.stub(cUiLogger, 'crit');
  cUiLogger.crit = critStub;

  t.teardown(() => {
    nock.cleanAll();
    critStub.restore();
  });

  aPi.inject({ /* Model, view, ptLogger, */ cUiLogger });

  await aPi.testPlans(jobFileContent);

  t.is(critStub.getCall(0).args[0], 'orchestrator is down, or an incorrect URL has been specified in the CLI config.');
  t.deepEqual(critStub.getCall(0).args[1], { tags: ['apiDecoratingAdapter'] });
  t.is(critStub.getCall(1), null);
});

test.serial('postToApi - on - invalid JSON syntax - should print useful error message', async (t) => {
  const { context: { jobFileContentLocalMissingComma } } = t;

  const { /* default: ptLogger, */ init: initPtLogger } = await import('purpleteam-logger');
  const { default: aPi } = await import(apiDecoratingAdapterPath);

  const cUiLogger = initPtLogger(config.get('loggers.cUi'));
  const critStub = sinon.stub(cUiLogger, 'crit');
  cUiLogger.crit = critStub;

  t.teardown(() => {
    critStub.restore();
  });

  aPi.inject({ /* Model, view, ptLogger, */ cUiLogger });

  await aPi.testPlans(jobFileContentLocalMissingComma);

  t.is(critStub.getCall(0).args[0], 'Error occurred while instantiating the model. Details follow: Invalid syntax in "Job": Unexpected string in JSON at position 1142');
  t.deepEqual(critStub.getCall(0).args[1], { tags: ['apiDecoratingAdapter'] });
  t.is(critStub.getCall(1), null);
});

test.serial('postToApi - on - invalid job based on purpleteam schema - should print useful error message', async (t) => {
  const { context: { jobFileContentLocalMissingTypeOfAppScanner } } = t;

  /* eslint-disable no-useless-escape */
  const expectedPrintedErrorMessage = `Error occurred while instantiating the model. Details follow: An error occurred while validating the Job. Details follow:
name: ValidationError
message. Errors: [
  {
    "instancePath": "/included/1",
    "schemaPath": "#/if",
    "keyword": "if",
    "params": {
      "failingKeyword": "then"
    },
    "message": "must match \\"then\\" schema"
  },
  {
    "instancePath": "/included/1",
    "schemaPath": "#/required",
    "keyword": "required",
    "params": {
      "missingProperty": "type"
    },
    "message": "must have required property 'type'"
  },
  {
    "instancePath": "/included/1/id",
    "schemaPath": "#/errorMessage",
    "keyword": "errorMessage",
    "params": {
      "errors": [
        {
          "instancePath": "/included/1/id",
          "schemaPath": "#/then/properties/id/pattern",
          "keyword": "pattern",
          "params": {
            "pattern": "NA"
          },
          "message": "must match pattern \\"NA\\"",
          "emUsed": true
        }
      ]
    },
    "message": "If type is tlsScanner, the id should be NA. If type is appScanner, the id should be a valid appScanner. If type is route, the id should be a valid route."
  }
]`;
  /* eslint-enable no-useless-escape */

  const { /* default: ptLogger, */ init: initPtLogger } = await import('purpleteam-logger');
  const { default: aPi } = await import(apiDecoratingAdapterPath);

  const cUiLogger = initPtLogger(config.get('loggers.cUi'));
  const critStub = sinon.stub(cUiLogger, 'crit');
  cUiLogger.crit = critStub;

  t.teardown(() => {
    critStub.restore();
  });

  aPi.inject({ /* Model, view, ptLogger, */ cUiLogger });

  await aPi.testPlans(jobFileContentLocalMissingTypeOfAppScanner);

  t.deepEqual(critStub.getCall(0).args[0], expectedPrintedErrorMessage);
  t.deepEqual(critStub.getCall(0).args[1], { tags: ['apiDecoratingAdapter'] });
  t.is(critStub.getCall(1), null);
});

test.serial('postToApi - on - unknown error - should print unknown error', async (t) => {
  const { context: { jobFileContent } } = t;

  const expectedResponse = 'is this a useful error message';

  nock(apiUrl).post('/testplan', expectedJob).replyWithError({ message: expectedResponse });

  const { /* default: ptLogger, */ init: initPtLogger } = await import('purpleteam-logger');
  const { default: aPi } = await import(apiDecoratingAdapterPath);

  const cUiLogger = initPtLogger(config.get('loggers.cUi'));
  const critStub = sinon.stub(cUiLogger, 'crit');
  cUiLogger.crit = critStub;

  const expectedPrintedErrorMessage = `Error occurred while attempting to communicate with the purpleteam API. Error was: Unknown error. Error follows: RequestError: ${expectedResponse}`;

  t.teardown(() => {
    nock.cleanAll();
    critStub.restore();
  });

  aPi.inject({ /* Model, view, ptLogger, */ cUiLogger });

  await aPi.testPlans(jobFileContent);

  t.deepEqual(critStub.getCall(0).args[0], expectedPrintedErrorMessage);
  t.deepEqual(critStub.getCall(0).args[1], { tags: ['apiDecoratingAdapter'] });
  t.is(critStub.getCall(1), null);
});

//
//
//
//
// Todo: As part of adding LP for AWS, add another set of tests similar to the above "postToApi" for cloud env, but we only need to cover the 4 knownError cases in the `gotPt = got.extend` hooks.
//
//
//
//

test.serial('test and subscribeToTesterFeedback - should subscribe to models tester events - should propagate initial tester responses from each tester to model - then verify event flow back through presenter and then to view', async (t) => {
  const { context: { jobFileContent } } = t;

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
  const { default: ptLogger /* , init: initPtLogger */ } = await import('purpleteam-logger');
  const { default: aPi } = await import(apiDecoratingAdapterPath);

  const testStub = sinon.stub(view, 'test');
  view.test = testStub;

  const handleTesterProgressStub = sinon.stub(view, 'handleTesterProgress');
  view.handleTesterProgress = handleTesterProgressStub;

  t.teardown(() => {
    nock.cleanAll();
    testStub.restore();
    handleTesterProgressStub.restore();
  });

  aPi.inject({ /* Model, */ view, /* ptLogger, cUiLogger */ EventSource });

  await aPi.test(jobFileContent);

  const expectedTesterSessions = [ // Taken from the model test
    { testerType: 'app', sessionId: 'lowPrivUser', threshold: 12 },
    { testerType: 'app', sessionId: 'adminUser', threshold: 0 },
    { testerType: 'server', sessionId: 'NA', threshold: 0 },
    { testerType: 'tls', sessionId: 'NA', threshold: 3 }
  ];

  t.deepEqual(testStub.getCall(0).args[0], expectedTesterSessions);
  t.is(testStub.callCount, 1);

  t.is(handleTesterProgressStub.callCount, 4);
  t.deepEqual(handleTesterProgressStub.getCall(0).args, [{ testerType: 'app', sessionId: 'lowPrivUser', message: 'Tester initialised.', ptLogger }]);
  t.deepEqual(handleTesterProgressStub.getCall(1).args, [{ testerType: 'app', sessionId: 'adminUser', message: 'Tester initialised.', ptLogger }]);
  t.deepEqual(handleTesterProgressStub.getCall(2).args, [{ testerType: 'server', sessionId: 'NA', message: 'No server testing available currently. The server tester is currently in-active.', ptLogger }]);
  t.deepEqual(handleTesterProgressStub.getCall(3).args, [{ testerType: 'tls', sessionId: 'NA', message: 'Tester initialised.', ptLogger }]);
});

test.serial('test and subscribeToTesterFeedback - should subscribe to models tester events - should propagate initial tester responses from each tester to model, even if app tester is offline - then verify event flow back through presenter and then to view', async (t) => {
  const { context: { jobFileContent } } = t;

  const apiResponse = {
    testerStatuses: [
      // {
      //   name: 'app',
      //   message: 'Tester initialised.'
      // },
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
  const { default: ptLogger /* , init: initPtLogger */ } = await import('purpleteam-logger');
  const { default: aPi } = await import(apiDecoratingAdapterPath);

  const testStub = sinon.stub(view, 'test');
  view.test = testStub;

  const handleTesterProgressStub = sinon.stub(view, 'handleTesterProgress');
  view.handleTesterProgress = handleTesterProgressStub;

  t.teardown(() => {
    nock.cleanAll();
    testStub.restore();
    handleTesterProgressStub.restore();
  });

  aPi.inject({ /* Model, */ view, /* ptLogger, cUiLogger */ EventSource });

  await aPi.test(jobFileContent);

  const expectedTesterSessions = [ // Taken from the model test
    { testerType: 'app', sessionId: 'lowPrivUser', threshold: 12 },
    { testerType: 'app', sessionId: 'adminUser', threshold: 0 },
    { testerType: 'server', sessionId: 'NA', threshold: 0 },
    { testerType: 'tls', sessionId: 'NA', threshold: 3 }
  ];

  t.deepEqual(testStub.getCall(0).args[0], expectedTesterSessions);
  t.is(testStub.callCount, 1);

  t.is(handleTesterProgressStub.callCount, 4);
  t.deepEqual(handleTesterProgressStub.getCall(0).args, [{ testerType: 'app', sessionId: 'lowPrivUser', message: '"app" Tester for session with Id "lowPrivUser" doesn\'t currently appear to be online', ptLogger }]);
  t.deepEqual(handleTesterProgressStub.getCall(1).args, [{ testerType: 'app', sessionId: 'adminUser', message: '"app" Tester for session with Id "adminUser" doesn\'t currently appear to be online', ptLogger }]);
  t.deepEqual(handleTesterProgressStub.getCall(2).args, [{ testerType: 'server', sessionId: 'NA', message: 'No server testing available currently. The server tester is currently in-active.', ptLogger }]);
  t.deepEqual(handleTesterProgressStub.getCall(3).args, [{ testerType: 'tls', sessionId: 'NA', message: 'Tester initialised.', ptLogger }]);
});

test('getJobFile - should return the Job file contents', async (t) => {
  const { context: { jobFileContent: jobFileContentExpected } } = t;
  const { default: aPi } = await import(apiDecoratingAdapterPath);
  const jobFileContentActual = await aPi.getJobFile(jobFilePath);
  t.deepEqual(jobFileContentExpected, jobFileContentActual);
});
