// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of PurpleTeam.

// PurpleTeam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// PurpleTeam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this PurpleTeam project. If not, see <https://www.gnu.org/licenses/>.

exports.lab = require('@hapi/lab').script();

const { describe, it, before, beforeEach, afterEach } = exports.lab;

const { expect, fail } = require('@hapi/code');
const sinon = require('sinon');
const rewire = require('rewire');
const nock = require('nock');
const readFileAsync = require('util').promisify(require('fs').readFile);
const config = require('../../config/config'); // eslint-disable-line import/order
const ptLogger = require('purpleteam-logger');

const cUiLogger = ptLogger.init(config.get('loggers.cUi'));

const apiUrl = config.get('purpleteamApi.url');
const jobFilePath = config.get('job.fileUri');
const { MockEvent, EventSource } = require('mocksse');
const { TesterFeedbackRoutePrefix } = require('../../src/strings');
const Model = require('../../src/models/model');

const cUiPath = '../../src/view/cUi';
const apiDecoratingAdapterPath = '../../src/presenter/apiDecoratingAdapter';

// As stored in the `request` object body from file: /testResources/jobs/job_1.0.0-alpha.3
const expectedJob = '\"{\\n  \\\"data\\\": {\\n    \\\"type\\\": \\\"job\\\",\\n    \\\"attributes\\\": {\\n      \\\"version\\\": \\\"1.0.0-alpha.3\\\",\\n      \\\"sutAuthentication\\\": {\\n        \\\"route\\\": \\\"/login\\\",\\n        \\\"usernameFieldLocater\\\": \\\"userName\\\",\\n        \\\"passwordFieldLocater\\\": \\\"password\\\",\\n        \\\"submit\\\": \\\"btn btn-danger\\\",\\n        \\\"expectedPageSourceSuccess\\\": \\\"Log Out\\\"\\n      },\\n      \\\"sutIp\\\": \\\"pt-sut-cont\\\",\\n      \\\"sutPort\\\": 4000,\\n      \\\"sutProtocol\\\": \\\"http\\\",\\n      \\\"browser\\\": \\\"chrome\\\",\\n      \\\"loggedInIndicator\\\": \\\"<p>Found. Redirecting to <a href=\\\\\\\"\\\\/dashboard\\\\\\\">\\\\/dashboard<\\\\/a><\\\\/p>\\\"\\n    },\\n    \\\"relationships\\\": {\\n      \\\"data\\\": [{\\n        \\\"type\\\": \\\"tlsScanner\\\",\\n        \\\"id\\\": \\\"NA\\\"\\n      },\\n      {\\n        \\\"type\\\": \\\"appScanner\\\",\\n        \\\"id\\\": \\\"lowPrivUser\\\"\\n      },\\n      {\\n        \\\"type\\\": \\\"appScanner\\\",\\n        \\\"id\\\": \\\"adminUser\\\"\\n      }]\\n    }\\n  },\\n  \\\"included\\\": [\\n    {\\n      \\\"type\\\": \\\"tlsScanner\\\",\\n      \\\"id\\\": \\\"NA\\\",\\n      \\\"attributes\\\": {\\n        \\\"tlsScannerSeverity\\\": \\\"LOW\\\",\\n        \\\"alertThreshold\\\": 3\\n      }\\n    },\\n    {\\n      \\\"type\\\": \\\"appScanner\\\",\\n      \\\"id\\\": \\\"lowPrivUser\\\",\\n      \\\"attributes\\\": {\\n        \\\"username\\\": \\\"user1\\\",\\n        \\\"password\\\": \\\"User1_123\\\",\\n        \\\"aScannerAttackStrength\\\": \\\"HIGH\\\",\\n        \\\"aScannerAlertThreshold\\\": \\\"LOW\\\",\\n        \\\"alertThreshold\\\": 12\\n      },\\n      \\\"relationships\\\": {\\n        \\\"data\\\": [{\\n          \\\"type\\\": \\\"route\\\",\\n          \\\"id\\\": \\\"/profile\\\"\\n        }]\\n      }\\n    },\\n    {\\n      \\\"type\\\": \\\"appScanner\\\",\\n      \\\"id\\\": \\\"adminUser\\\",\\n      \\\"attributes\\\": {\\n        \\\"username\\\": \\\"admin\\\",\\n        \\\"password\\\": \\\"Admin_123\\\"\\n      },\\n      \\\"relationships\\\": {\\n        \\\"data\\\": [{\\n          \\\"type\\\": \\\"route\\\",\\n          \\\"id\\\": \\\"/memos\\\"\\n        },\\n        {\\n          \\\"type\\\": \\\"route\\\",\\n          \\\"id\\\": \\\"/profile\\\"\\n        }]\\n      }\\n    },\\n    {\\n      \\\"type\\\": \\\"route\\\",\\n      \\\"id\\\": \\\"/profile\\\",\\n      \\\"attributes\\\": {\\n        \\\"attackFields\\\": [\\n          {\\\"name\\\": \\\"firstName\\\", \\\"value\\\": \\\"PurpleJohn\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"lastName\\\", \\\"value\\\": \\\"PurpleDoe\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"ssn\\\", \\\"value\\\": \\\"PurpleSSN\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"dob\\\", \\\"value\\\": \\\"12235678\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"bankAcc\\\", \\\"value\\\": \\\"PurpleBankAcc\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"bankRouting\\\", \\\"value\\\": \\\"0198212#\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"address\\\", \\\"value\\\": \\\"PurpleAddress\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"website\\\", \\\"value\\\": \\\"https://purpleteam-labs.com\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"_csrf\\\", \\\"value\\\": \\\"\\\"},\\n          {\\\"name\\\": \\\"submit\\\", \\\"value\\\": \\\"\\\"}\\n        ],\\n        \\\"method\\\": \\\"POST\\\",\\n        \\\"submit\\\": \\\"submit\\\"\\n      }\\n    },\\n    {\\n      \\\"type\\\": \\\"route\\\",\\n      \\\"id\\\": \\\"/memos\\\",\\n      \\\"attributes\\\": {\\n        \\\"attackFields\\\": [\\n          {\\\"name\\\": \\\"memo\\\", \\\"value\\\": \\\"PurpleMemo\\\", \\\"visible\\\": true}\\n        ],\\n        \\\"method\\\": \\\"POST\\\",\\n        \\\"submit\\\": \\\"btn btn-primary\\\"\\n      }\\n    }\\n  ]\\n}\\n\"'; // eslint-disable-line no-useless-escape
// As stored in the `request` object body from file: /testResources/jobs/job_1.0.0-alpha.3_missing_type_of_appScanner
const expectedJobMissingTypeAppScanner = '\"{\\n  \\\"data\\\": {\\n    \\\"type\\\": \\\"job\\\",\\n    \\\"attributes\\\": {\\n      \\\"version\\\": \\\"1.0.0-alpha.3\\\",\\n      \\\"sutAuthentication\\\": {\\n        \\\"route\\\": \\\"/login\\\",\\n        \\\"usernameFieldLocater\\\": \\\"userName\\\",\\n        \\\"passwordFieldLocater\\\": \\\"password\\\",\\n        \\\"submit\\\": \\\"btn btn-danger\\\",\\n        \\\"expectedPageSourceSuccess\\\": \\\"Log Out\\\"\\n      },\\n      \\\"sutIp\\\": \\\"pt-sut-cont\\\",\\n      \\\"sutPort\\\": 4000,\\n      \\\"sutProtocol\\\": \\\"http\\\",\\n      \\\"browser\\\": \\\"chrome\\\",\\n      \\\"loggedInIndicator\\\": \\\"<p>Found. Redirecting to <a href=\\\\\\\"\\\\/dashboard\\\\\\\">\\\\/dashboard<\\\\/a><\\\\/p>\\\"\\n    },\\n    \\\"relationships\\\": {\\n      \\\"data\\\": [{\\n        \\\"type\\\": \\\"appScanner\\\",\\n        \\\"id\\\": \\\"lowPrivUser\\\"\\n      },\\n      {\\n        \\\"type\\\": \\\"appScanner\\\",\\n        \\\"id\\\": \\\"adminUser\\\"\\n      }]\\n    }\\n  },\\n  \\\"included\\\": [\\n    {\\n      \\\"type\\\": \\\"tlsScanner\\\",\\n      \\\"id\\\": \\\"NA\\\",\\n      \\\"attributes\\\": {\\n        \\\"tlsScannerSeverity\\\": \\\"LOW\\\",\\n        \\\"alertThreshold\\\": 3\\n      }\\n    },\\n    {\\n      \\\"id\\\": \\\"lowPrivUser\\\",\\n      \\\"attributes\\\": {\\n        \\\"username\\\": \\\"user1\\\",\\n        \\\"password\\\": \\\"User1_123\\\",\\n        \\\"aScannerAttackStrength\\\": \\\"HIGH\\\",\\n        \\\"aScannerAlertThreshold\\\": \\\"LOW\\\",\\n        \\\"alertThreshold\\\": 12\\n      },\\n      \\\"relationships\\\": {\\n        \\\"data\\\": [{\\n          \\\"type\\\": \\\"route\\\",\\n          \\\"id\\\": \\\"/profile\\\"\\n        }]\\n      }\\n    },\\n    {\\n      \\\"type\\\": \\\"appScanner\\\",\\n      \\\"id\\\": \\\"adminUser\\\",\\n      \\\"attributes\\\": {\\n        \\\"username\\\": \\\"admin\\\",\\n        \\\"password\\\": \\\"Admin_123\\\"\\n      },\\n      \\\"relationships\\\": {\\n        \\\"data\\\": [{\\n          \\\"type\\\": \\\"route\\\",\\n          \\\"id\\\": \\\"/memos\\\"\\n        },\\n        {\\n          \\\"type\\\": \\\"route\\\",\\n          \\\"id\\\": \\\"/profile\\\"\\n        }]\\n      }\\n    },\\n    {\\n      \\\"type\\\": \\\"route\\\",\\n      \\\"id\\\": \\\"/profile\\\",\\n      \\\"attributes\\\": {\\n        \\\"attackFields\\\": [\\n          {\\\"name\\\": \\\"firstName\\\", \\\"value\\\": \\\"PurpleJohn\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"lastName\\\", \\\"value\\\": \\\"PurpleDoe\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"ssn\\\", \\\"value\\\": \\\"PurpleSSN\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"dob\\\", \\\"value\\\": \\\"12235678\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"bankAcc\\\", \\\"value\\\": \\\"PurpleBankAcc\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"bankRouting\\\", \\\"value\\\": \\\"0198212#\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"address\\\", \\\"value\\\": \\\"PurpleAddress\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"website\\\", \\\"value\\\": \\\"https://purpleteam-labs.com\\\", \\\"visible\\\": true},\\n          {\\\"name\\\": \\\"_csrf\\\", \\\"value\\\": \\\"\\\"},\\n          {\\\"name\\\": \\\"submit\\\", \\\"value\\\": \\\"\\\"}\\n        ],\\n        \\\"method\\\": \\\"POST\\\",\\n        \\\"submit\\\": \\\"submit\\\"\\n      }\\n    },\\n    {\\n      \\\"type\\\": \\\"route\\\",\\n      \\\"id\\\": \\\"/memos\\\",\\n      \\\"attributes\\\": {\\n        \\\"attackFields\\\": [\\n          {\\\"name\\\": \\\"memo\\\", \\\"value\\\": \\\"PurpleMemo\\\", \\\"visible\\\": true}\\n        ],\\n        \\\"method\\\": \\\"POST\\\",\\n        \\\"submit\\\": \\\"btn btn-primary\\\"\\n      }\\n    }\\n  ]\\n}\\n\"'; // eslint-disable-line no-useless-escape


describe('apiDecoratingAdapter', () => {
  before(async (flags) => {
    flags.context.jobFileContent = await (async () => readFileAsync(jobFilePath, { encoding: 'utf8' }))();
  });
  describe('testPlans', () => {
    it('- should provide the cUi with the test plan to display', async (flags) => {
      const { context: { jobFileContent } } = flags;
      const cUi = rewire(cUiPath);
      config.set('env', 'local'); // For got hooks only.
      const rewiredApi = rewire(apiDecoratingAdapterPath);
      const jobFileContents = await jobFileContent;

      const expectedArgPasssedToTestPlan = [{
        name: 'app',
        message: `@app_scan
        Feature: Web application free of security vulnerabilities known to Zap
        
        # Before hooks are run before Background
        
        Background:
          Given a new Test Session based on each Build User supplied appScanner resourceObject
          And each Build User supplied route of each appScanner resourceObject is navigated
          And a new scanning session based on each Build User supplied appScanner resourceObject
          And the application is spidered for each appScanner resourceObject
          And all active scanners are disabled
        
        Scenario: The application should not contain vulnerabilities known to Zap that exceed the Build User defined threshold
          Given all active scanners are enabled 
          When the active scan is run
          Then the vulnerability count should not exceed the Build User defined threshold of vulnerabilities known to Zap
        
        
        
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

      const testPlanStub = sinon.stub(cUi, 'testPlan');
      cUi.testPlan = testPlanStub;
      const revertRewiredApiCui = rewiredApi.__set__('view', cUi);

      flags.onCleanup = () => {
        cUi.testPlan.restore();
        revertRewiredApiCui();
        config.set('env', 'test');
        nock.cleanAll();
      };

      await rewiredApi.testPlans(jobFileContents);

      expect(testPlanStub.getCall(0).args[0]).to.equal({ testPlans: expectedArgPasssedToTestPlan, ptLogger });
    });
  });


  describe('postToApi', () => {
    beforeEach(async (flags) => {
      const { context } = flags;
      config.set('env', 'local'); // For got hooks only.
      context.rewiredApi = rewire(apiDecoratingAdapterPath);

      context.log = cUiLogger;
      context.critStub = sinon.stub(context.log, 'crit');
      context.log.crit = context.critStub;

      context.revertRewiredApiLog = context.rewiredApi.__set__('cUiLogger', context.log);
    });


    // it('- on - socket hang up - should throw error - backendTookToLong', () => {
    //   // Todo: KC: Need to reproduce error state.
    // });

    it('- on - connect EHOSTUNREACH - should print message - orchestrator is down...', async (flags) => {
      const { context: { jobFileContent, rewiredApi, critStub } } = flags;
      const jobFileContents = await jobFileContent;

      nock(apiUrl).post('/testplan', expectedJob).replyWithError({ code: 'EHOSTUNREACH' });

      await rewiredApi.testPlans(jobFileContents);

      expect(critStub.getCall(0).args[0]).to.equal('orchestrator is down, or an incorrect URL has been specified in the CLI config.');
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });


    it('- on - invalid JSON syntax - should print useful error message', async (flags) => {
      const { context: { rewiredApi, critStub } } = flags;
      const jobFileContents = await (async () => readFileAsync(`${process.cwd()}/testResources/jobs/job_1.0.0-alpha.3_local_missing_comma`, { encoding: 'utf8' }))();

      const expectedPrintedErrorMessage = 'Error occurred while instantiating the model. Details follow: Invalid syntax in "Job": Unexpected string in JSON at position 1005';

      await rewiredApi.testPlans(jobFileContents);

      expect(critStub.getCall(0).args[0]).to.equal(expectedPrintedErrorMessage);
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });


    it('- on - invalid job based on purpleteam schema - should print useful error message', async (flags) => {
      // Lots of checking around the validation on the server side will be required.
      const { context: { rewiredApi, critStub } } = flags;
      const jobFileContents = await (async () => readFileAsync(`${process.cwd()}/testResources/jobs/job_1.0.0-alpha.3_local_missing_type_of_appScanner`, { encoding: 'utf8' }))();

      const expectedResponseBodyMessage = '';// Doesn't matter what this is, we don't check it.
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

      nock(apiUrl).post('/testplan', expectedJobMissingTypeAppScanner).reply(400, { message: expectedResponseBodyMessage });

      await rewiredApi.testPlans(jobFileContents);

      expect(critStub.getCall(0).args[0]).to.equal(expectedPrintedErrorMessage);
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });


    it('- on - unknown error - should print unknown error', async (flags) => {
      const { context: { jobFileContent, rewiredApi, critStub } } = flags;
      const jobFileContents = await jobFileContent;

      const expectedResponse = 'is this a useful error message';
      const expectedPrintedErrorMessage = `Error occurred while attempting to communicate with the purpleteam API. Error was: Unknown error. Error follows: RequestError: ${expectedResponse}`;

      nock(apiUrl).post('/testplan', expectedJob).replyWithError({ message: expectedResponse });

      await rewiredApi.testPlans(jobFileContents);

      expect(critStub.getCall(0).args[0]).to.equal(expectedPrintedErrorMessage);
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });


    afterEach((flags) => {
      const { context } = flags;
      context.revertRewiredApiLog();
      context.log.crit.restore();
      config.set('env', 'test'); // For got hooks only.
      nock.cleanAll();
    });
  });


  //
  //
  //
  //
  // Todo: As part of adding Long Polling for AWS, add another describe set for cloud env, similar to the above, but we only need to cover the 4 knownError cases in the `gotPt = got.extend` hooks.
  //
  //
  //
  //


  describe('test and subscribeToTesterFeedback', /* async */ () => {
    beforeEach(async (flags) => {
      const { context } = flags;
      config.set('env', 'local'); // For got hooks only.
      context.rewiredApi = rewire(apiDecoratingAdapterPath);
      context.jobFileContents = await context.jobFileContent;
    });


    it('- should subscribe to models tester events - should propagate initial tester responses from each tester to model - then verify event flow back through presenter and then to view', async (flags) => {
      const { context: { jobFileContents, rewiredApi } } = flags;
      // Make cUi a local test identifier because the error event listener of subscribeToTesterFeedback in apiDecoratingAdapter
      // is still executing after the test finishes.
      // If we restore the cUi, the logger of handleTesterProgress in the cUi.js is undefined
      const cUi = rewire(cUiPath);
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

      const testStub = sinon.stub(cUi, 'test');
      cUi.test = testStub;

      const rewiredHandleModelTesterEvents = rewiredApi.__get__('handleModelTesterEvents');
      const handleModelTesterEventsSpy = sinon.spy(rewiredHandleModelTesterEvents);
      const revertRewiredApiHandleModelTesterEvents = rewiredApi.__set__('handleModelTesterEvents', handleModelTesterEventsSpy);

      const handleTesterProgressStub = sinon.stub(cUi, 'handleTesterProgress');
      cUi.handleTesterProgress = handleTesterProgressStub;

      /* const revertRewiredApiView = */ rewiredApi.__set__('view', cUi);
      const revertRewiredApiApiUrl = rewiredApi.__set__('apiUrl', `${apiUrl}`);

      flags.onCleanup = () => {
        // cUi.test.restore();
        // cUi.handleTesterProgress.restore();
        revertRewiredApiHandleModelTesterEvents();
        // revertRewiredApiCui();
        revertRewiredApiApiUrl();
        config.set('env', 'test'); // For got hooks only.
        nock.cleanAll();
      };

      await rewiredApi.test(jobFileContents);

      const expectedTesterSessions = [ // Taken from the model test
        { testerType: 'app', sessionId: 'lowPrivUser', threshold: 12 },
        { testerType: 'app', sessionId: 'adminUser', threshold: 0 },
        { testerType: 'server', sessionId: 'NA', threshold: 0 },
        { testerType: 'tls', sessionId: 'NA', threshold: 3 }
      ];

      expect(testStub.getCall(0).args[0]).to.equal(expectedTesterSessions);
      expect(testStub.callCount).to.equal(1);

      expect(handleModelTesterEventsSpy.callCount).to.equal(4);
      expect(handleTesterProgressStub.callCount).to.equal(4);

      expect(handleModelTesterEventsSpy.getCall(0).args).to.equal(['testerProgress', 'app', 'lowPrivUser', 'Tester initialised.']);
      expect(handleTesterProgressStub.getCall(0).args).to.equal([{ testerType: 'app', sessionId: 'lowPrivUser', message: 'Tester initialised.', ptLogger }]);

      expect(handleModelTesterEventsSpy.getCall(1).args).to.equal(['testerProgress', 'app', 'adminUser', 'Tester initialised.']);
      expect(handleTesterProgressStub.getCall(1).args).to.equal([{ testerType: 'app', sessionId: 'adminUser', message: 'Tester initialised.', ptLogger }]);

      expect(handleModelTesterEventsSpy.getCall(2).args).to.equal(['testerProgress', 'server', 'NA', 'No server testing available currently. The server tester is currently in-active.']);
      expect(handleTesterProgressStub.getCall(2).args).to.equal([{ testerType: 'server', sessionId: 'NA', message: 'No server testing available currently. The server tester is currently in-active.', ptLogger }]);

      expect(handleModelTesterEventsSpy.getCall(3).args).to.equal(['testerProgress', 'tls', 'NA', 'Tester initialised.']);
      expect(handleTesterProgressStub.getCall(3).args).to.equal([{ testerType: 'tls', sessionId: 'NA', message: 'Tester initialised.', ptLogger }]);
    });

    it('- should subscribe to models tester events - should propagate initial tester responses from each tester to model, even if app tester is offline - then verify event flow back through presenter and then to view', async (flags) => {
      const { context: { jobFileContents, rewiredApi } } = flags;
      // Make cUi a local test identifier because the error event listener of subscribeToTesterFeedback in apiDecoratingAdapter
      // is still executing after the test finishes.
      // If we restore the cUi, the logger of handleTesterProgress in the cUi.js is undefined
      const cUi = rewire(cUiPath);
      const apiResponse = {
        testerStatuses: [
        // Simulate no response from app tester to orchestrator.
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

      const testStub = sinon.stub(cUi, 'test');
      cUi.test = testStub;

      const rewiredHandleModelTesterEvents = rewiredApi.__get__('handleModelTesterEvents');
      const handleModelTesterEventsSpy = sinon.spy(rewiredHandleModelTesterEvents);
      const revertRewiredApiHandleModelTesterEvents = rewiredApi.__set__('handleModelTesterEvents', handleModelTesterEventsSpy);

      const handleTesterProgressStub = sinon.stub(cUi, 'handleTesterProgress');
      cUi.handleTesterProgress = handleTesterProgressStub;

      /* const revertRewiredApiView = */ rewiredApi.__set__('view', cUi);
      const revertRewiredApiApiUrl = rewiredApi.__set__('apiUrl', `${apiUrl}`);

      flags.onCleanup = () => {
        // cUi.test.restore();
        // cUi.handleTesterProgress.restore();
        revertRewiredApiHandleModelTesterEvents();
        // revertRewiredApiCui();
        revertRewiredApiApiUrl();
        config.set('env', 'test'); // For got hooks only.
        nock.cleanAll();
      };

      await rewiredApi.test(jobFileContents);

      const expectedTesterSessions = [ // Taken from the model test
        { testerType: 'app', sessionId: 'lowPrivUser', threshold: 12 },
        { testerType: 'app', sessionId: 'adminUser', threshold: 0 },
        { testerType: 'server', sessionId: 'NA', threshold: 0 },
        { testerType: 'tls', sessionId: 'NA', threshold: 3 }
      ];

      expect(testStub.getCall(0).args[0]).to.equal(expectedTesterSessions);
      expect(testStub.callCount).to.equal(1);

      expect(handleModelTesterEventsSpy.callCount).to.equal(4);
      expect(handleTesterProgressStub.callCount).to.equal(4);

      expect(handleModelTesterEventsSpy.getCall(0).args).to.equal(['testerProgress', 'app', 'lowPrivUser', '"app" Tester for session with Id "lowPrivUser" doesn\'t currently appear to be online']);
      expect(handleTesterProgressStub.getCall(0).args).to.equal([{ testerType: 'app', sessionId: 'lowPrivUser', message: '"app" Tester for session with Id "lowPrivUser" doesn\'t currently appear to be online', ptLogger }]);

      expect(handleModelTesterEventsSpy.getCall(1).args).to.equal(['testerProgress', 'app', 'adminUser', '"app" Tester for session with Id "adminUser" doesn\'t currently appear to be online']);
      expect(handleTesterProgressStub.getCall(1).args).to.equal([{ testerType: 'app', sessionId: 'adminUser', message: '"app" Tester for session with Id "adminUser" doesn\'t currently appear to be online', ptLogger }]);

      expect(handleModelTesterEventsSpy.getCall(2).args).to.equal(['testerProgress', 'server', 'NA', 'No server testing available currently. The server tester is currently in-active.']);
      expect(handleTesterProgressStub.getCall(2).args).to.equal([{ testerType: 'server', sessionId: 'NA', message: 'No server testing available currently. The server tester is currently in-active.', ptLogger }]);

      expect(handleModelTesterEventsSpy.getCall(3).args).to.equal(['testerProgress', 'tls', 'NA', 'Tester initialised.']);
      expect(handleTesterProgressStub.getCall(3).args).to.equal([{ testerType: 'tls', sessionId: 'NA', message: 'Tester initialised.', ptLogger }]);
    });
  });


  describe('subscribeToTesterFeedback SSE and handlers', /* async */ () => {
    before(async (flags) => {
      flags.context.testerStatuses = [
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
      ];
    });


    beforeEach(async (flags) => {
      const { context } = flags;
      const jobFileContents = await context.jobFileContent;
      context.model = new Model(jobFileContents);
      config.set('env', 'local'); // For got hooks only.
      const rewiredApi = rewire(apiDecoratingAdapterPath);

      context.revertRewiredApiEventSource = rewiredApi.__set__('EventSource', EventSource);
      context.rewiredSubscribeToTesterFeedback = rewiredApi.__get__('subscribeToTesterFeedback');
      context.rewiredApi = rewiredApi;
    });


    it('- given a mock event for each of the available testers sessions - given invocation of all the tester events - relevant handler instances should be run', async (flags) => {
      const { context: { model, rewiredSubscribeToTesterFeedback, rewiredApi, testerStatuses } } = flags;
      const numberOfEvents = 6;
      new MockEvent({ // eslint-disable-line no-new
        url: `${apiUrl}/${TesterFeedbackRoutePrefix('sse')}/app/lowPrivUser`,
        setInterval: 1,
        responses: [
          { lastEventId: 'one', type: 'testerProgress', data: { progress: 'Initialising subscription to "app-lowPrivUser" channel for the event "testerProgress"' } },
          { lastEventId: 'two', type: 'testerPctComplete', data: { pctComplete: 8 } },
          { lastEventId: 'three', type: 'testerBugCount', data: { bugCount: 3 } }
        ]
      });
      new MockEvent({ // eslint-disable-line no-new
        url: `${apiUrl}/${TesterFeedbackRoutePrefix('sse')}/app/adminUser`,
        setInterval: 1,
        responses: [
          { lastEventId: 'four', type: 'testerProgress', data: { progress: 'Initialising subscription to "app-adminUser" channel for the event "testerProgress"' } },
          { lastEventId: 'five', type: 'testerPctComplete', data: { pctComplete: 99 } },
          { lastEventId: 'six', type: 'testerBugCount', data: { bugCount: 7 } }
        ]
      });
      const eventHandled = { one: false, two: false, three: false, four: false, five: false, six: false };
      await new Promise((resolve) => {
        let handlerCallCount = 0;
        const checkExpectations = {
          one: (event, testerNameAndSessionToCheck) => {
            expect(event.type).to.equal('testerProgress');
            expect(event.data).to.equal({ progress: 'Initialising subscription to "app-lowPrivUser" channel for the event "testerProgress"' });
            expect(event.lastEventId).to.equal('one');
            expect(event.origin).to.equal(apiUrl);
            expect(testerNameAndSessionToCheck.testerType).to.equal('app');
            expect(testerNameAndSessionToCheck.sessionId).to.equal('lowPrivUser');
          },
          two: (event, testerNameAndSessionToCheck) => {
            expect(event.type).to.equal('testerPctComplete');
            expect(event.data).to.equal({ pctComplete: 8 });
            expect(event.lastEventId).to.equal('two');
            expect(event.origin).to.equal(apiUrl);
            expect(testerNameAndSessionToCheck.testerType).to.equal('app');
            expect(testerNameAndSessionToCheck.sessionId).to.equal('lowPrivUser');
          },
          three: (event, testerNameAndSessionToCheck) => {
            expect(event.type).to.equal('testerBugCount');
            expect(event.data).to.equal({ bugCount: 3 });
            expect(event.lastEventId).to.equal('three');
            expect(event.origin).to.equal(apiUrl);
            expect(testerNameAndSessionToCheck.testerType).to.equal('app');
            expect(testerNameAndSessionToCheck.sessionId).to.equal('lowPrivUser');
          },
          four: (event, testerNameAndSessionToCheck) => {
            expect(event.type).to.equal('testerProgress');
            expect(event.data).to.equal({ progress: 'Initialising subscription to "app-adminUser" channel for the event "testerProgress"' });
            expect(event.lastEventId).to.equal('four');
            expect(event.origin).to.equal(apiUrl);
            expect(testerNameAndSessionToCheck.testerType).to.equal('app');
            expect(testerNameAndSessionToCheck.sessionId).to.equal('adminUser');
          },
          five: (event, testerNameAndSessionToCheck) => {
            expect(event.type).to.equal('testerPctComplete');
            expect(event.data).to.equal({ pctComplete: 99 });
            expect(event.lastEventId).to.equal('five');
            expect(event.origin).to.equal(apiUrl);
            expect(testerNameAndSessionToCheck.testerType).to.equal('app');
            expect(testerNameAndSessionToCheck.sessionId).to.equal('adminUser');
          },
          six: (event, testerNameAndSessionToCheck) => {
            expect(event.type).to.equal('testerBugCount');
            expect(event.data).to.equal({ bugCount: 7 });
            expect(event.lastEventId).to.equal('six');
            expect(event.origin).to.equal(apiUrl);
            expect(testerNameAndSessionToCheck.testerType).to.equal('app');
            expect(testerNameAndSessionToCheck.sessionId).to.equal('adminUser');
          }
        };
        const handleServerSentTesterEvents = (event, receivedModel, testerNameAndSession) => {
          handlerCallCount += 1;

          expect(receivedModel).to.equal(model);

          if (eventHandled[event.lastEventId] === true) fail(`An event with a lastEventId of "${event.lastEventId}" was handled more than once.`);
          eventHandled[event.lastEventId] = true;
          checkExpectations[event.lastEventId](event, testerNameAndSession);

          if (handlerCallCount === numberOfEvents) resolve();
        };

        rewiredApi.__set__('handleServerSentTesterEvents', handleServerSentTesterEvents);

        rewiredSubscribeToTesterFeedback(model, testerStatuses);
      });

      flags.onCleanup = () => {
        expect(eventHandled.one).to.be.true();
        expect(eventHandled.two).to.be.true();
        expect(eventHandled.three).to.be.true();
        expect(eventHandled.four).to.be.true();
        expect(eventHandled.five).to.be.true();
        expect(eventHandled.six).to.be.true();
      };
    });


    afterEach((flags) => {
      const { context } = flags;
      context.revertRewiredApiEventSource();
      config.set('env', 'test'); // For got hooks only.
    });
  });


  describe('getJobFile', /* async */ () => {
    before(async (flags) => {
      flags.context.jobFileContent = await (async () => readFileAsync(jobFilePath, { encoding: 'utf8' }))();
    });
    it('- should return the Job file contents', async (flags) => {
      const { context: { jobFileContent } } = flags;
      config.set('env', 'local'); // For got hooks only.

      flags.onCleanup = () => { config.set('env', 'test'); };
      const rewiredApi = rewire(apiDecoratingAdapterPath);
      const jobFileContents = await rewiredApi.getJobFile(jobFilePath);
      expect(jobFileContents).to.equal(jobFileContent);
    });
  });


  describe('handleModelTesterEvents', /* async */ () => {
    beforeEach(async (flags) => {
      const { context } = flags;
      config.set('env', 'local'); // For got hooks only.
      context.rewiredApi = rewire(apiDecoratingAdapterPath);
    });
    it('- given event `testerProgress` handleTesterProgress of the view should be called with correct arguments', async (flags) => {
      const { context: { rewiredApi } } = flags;
      const cUi = rewire(cUiPath);
      const handleTesterProgressStub = sinon.stub(cUi, 'handleTesterProgress');
      cUi.handleTesterProgress = handleTesterProgressStub;
      const revertRewiredApiCui = rewiredApi.__set__('view', cUi);
      const rewiredHandleModelTesterEvents = rewiredApi.__get__('handleModelTesterEvents');

      const eventName = 'testerProgress';
      const testerType = 'app';
      const sessionId = 'lowPrivUser';
      const message = 'Tester initialised.';
      const parameters = [{ testerType, sessionId, message, ptLogger }];

      flags.onCleanup = () => {
        cUi.handleTesterProgress.restore();
        revertRewiredApiCui();
        config.set('env', 'test'); // For got hooks only.
      };

      rewiredHandleModelTesterEvents(eventName, testerType, sessionId, message);

      expect(handleTesterProgressStub.callCount).to.equal(1);
      expect(handleTesterProgressStub.getCall(0).args).to.equal(parameters);
    });


    it('- given event `testerPctComplete` handleTesterPctComplete of the view should be called with correct arguments', async (flags) => {
      const { context: { rewiredApi } } = flags;
      const cUi = rewire(cUiPath);
      const handleTesterPctCompleteStub = sinon.stub(cUi, 'handleTesterPctComplete');
      cUi.handleTesterPctComplete = handleTesterPctCompleteStub;
      const revertRewiredApiCui = rewiredApi.__set__('view', cUi);
      const rewiredHandleModelTesterEvents = rewiredApi.__get__('handleModelTesterEvents');

      const eventName = 'testerPctComplete';
      const testerType = 'app';
      const sessionId = 'lowPrivUser';
      const message = 11;
      const parameters = [{ testerType, sessionId, message, ptLogger }];

      flags.onCleanup = () => {
        cUi.handleTesterPctComplete.restore();
        revertRewiredApiCui();
        config.set('env', 'test'); // For got hooks only.
      };

      rewiredHandleModelTesterEvents(eventName, testerType, sessionId, message);

      expect(handleTesterPctCompleteStub.callCount).to.equal(1);
      expect(handleTesterPctCompleteStub.getCall(0).args).to.equal(parameters);
    });


    it('- given event `testerBugCount` handleTesterBugCount of the view should be called with correct arguments', async (flags) => {
      const { context: { rewiredApi } } = flags;
      const cUi = rewire(cUiPath);
      const handleTesterBugCountStub = sinon.stub(cUi, 'handleTesterBugCount');
      cUi.handleTesterBugCount = handleTesterBugCountStub;
      const revertRewiredApiCui = rewiredApi.__set__('view', cUi);
      const rewiredHandleModelTesterEvents = rewiredApi.__get__('handleModelTesterEvents');

      const eventName = 'testerBugCount';
      const testerType = 'app';
      const sessionId = 'lowPrivUser';
      const message = 56;
      const parameters = [{ testerType, sessionId, message, ptLogger }];

      flags.onCleanup = () => {
        cUi.handleTesterBugCount.restore();
        revertRewiredApiCui();
        config.set('env', 'test'); // For got hooks only.
      };

      rewiredHandleModelTesterEvents(eventName, testerType, sessionId, message);

      expect(handleTesterBugCountStub.callCount).to.equal(1);
      expect(handleTesterBugCountStub.getCall(0).args).to.equal(parameters);
    });
  });


  describe('handleServerSentTesterEvents', () => {
    beforeEach(async (flags) => {
      const { context } = flags;
      const jobFileContents = await context.jobFileContent;
      context.model = new Model(jobFileContents);
      context.modelPropagateTesterMessageStub = sinon.stub(context.model, 'propagateTesterMessage');
      config.set('env', 'local'); // For got hooks only.
      context.rewiredApi = rewire(apiDecoratingAdapterPath);
      context.rewiredHandleServerSentTesterEvents = context.rewiredApi.__get__('handleServerSentTesterEvents');
    });


    describe('- event with message - should model.propagateTesterMessage', () => {
      it('`testerProgress`', (flags) => {
        const { context: { model, modelPropagateTesterMessageStub, rewiredHandleServerSentTesterEvents } } = flags;
        const event = {
          type: 'testerProgress',
          data: '{"progress":"it is {red-fg}raining{/red-fg} cats and dogs1535354779913, session: lowPrivUser"}',
          lastEventId: '1535354779913',
          origin: apiUrl
        };
        const testerNameAndSession = { sessionId: 'lowPrivUser', testerType: 'app' };

        rewiredHandleServerSentTesterEvents(event, model, testerNameAndSession);

        expect(modelPropagateTesterMessageStub.callCount).to.equal(1);
        expect(modelPropagateTesterMessageStub.getCall(0).args).to.equal([{
          testerType: testerNameAndSession.testerType,
          sessionId: testerNameAndSession.sessionId,
          message: 'it is {red-fg}raining{/red-fg} cats and dogs1535354779913, session: lowPrivUser',
          event: event.type
        }]);
      });


      it('`testerPctComplete`', (flags) => {
        const { context: { model, modelPropagateTesterMessageStub, rewiredHandleServerSentTesterEvents } } = flags;
        const event = {
          type: 'testerPctComplete',
          data: '{"pctComplete":100}',
          lastEventId: '1535354779913',
          origin: apiUrl
        };
        const testerNameAndSession = { sessionId: 'lowPrivUser', testerType: 'app' };

        rewiredHandleServerSentTesterEvents(event, model, testerNameAndSession);

        expect(modelPropagateTesterMessageStub.callCount).to.equal(1);
        expect(modelPropagateTesterMessageStub.getCall(0).args).to.equal([{
          testerType: testerNameAndSession.testerType,
          sessionId: testerNameAndSession.sessionId,
          message: 100,
          event: event.type
        }]);
      });


      it('`testerBugCount`', (flags) => {
        const { context: { model, modelPropagateTesterMessageStub, rewiredHandleServerSentTesterEvents } } = flags;
        const event = {
          type: 'testerBugCount',
          data: '{"bugCount":2}',
          lastEventId: '1535354779913',
          origin: apiUrl
        };
        const testerNameAndSession = { sessionId: 'lowPrivUser', testerType: 'app' };

        rewiredHandleServerSentTesterEvents(event, model, testerNameAndSession);

        expect(modelPropagateTesterMessageStub.callCount).to.equal(1);
        expect(modelPropagateTesterMessageStub.getCall(0).args).to.equal([{
          testerType: testerNameAndSession.testerType,
          sessionId: testerNameAndSession.sessionId,
          message: 2,
          event: event.type
        }]);
      });
    });


    it('- given `testerProgress` event with falsy message - should log.warning with appropriate message', (flags) => {
      const { context: { model, modelPropagateTesterMessageStub, rewiredHandleServerSentTesterEvents, rewiredApi } } = flags;
      const warningStub = sinon.stub(cUiLogger, 'warning');
      cUiLogger.warning = warningStub;
      const revertRewiredApiLog = rewiredApi.__set__('cUiLogger', cUiLogger);

      const event = {
        type: 'testerProgress',
        data: '{"progress":null}',
        lastEventId: '1535354779913',
        origin: apiUrl
      };
      const testerNameAndSession = { sessionId: 'lowPrivUser', testerType: 'app' };

      flags.onCleanup = () => {
        cUiLogger.warning.restore();
        revertRewiredApiLog();
      };

      rewiredHandleServerSentTesterEvents(event, model, testerNameAndSession);

      expect(modelPropagateTesterMessageStub.callCount).to.equal(0);
      expect(warningStub.callCount).to.equal(1);
      expect(warningStub.getCall(0).args).to.equal([`A falsy ${event.type} event message was received from the orchestrator`, { tags: ['apiDecoratingAdapter'] }]);
    });


    it('- given event with incorrect origin - should provide model.propagateTesterMessage with useful error message', (flags) => {
      const { context: { model, modelPropagateTesterMessageStub, rewiredHandleServerSentTesterEvents } } = flags;
      const event = { origin: 'devious origin' };
      const testerNameAndSession = { sessionId: 'lowPrivUser', testerType: 'app' };

      rewiredHandleServerSentTesterEvents(event, model, testerNameAndSession);

      expect(modelPropagateTesterMessageStub.callCount).to.equal(1);
      expect(modelPropagateTesterMessageStub.getCall(0).args).to.equal([{
        testerType: testerNameAndSession.testerType,
        sessionId: testerNameAndSession.sessionId,
        message: `Origin of event was incorrect. Actual: "${event.origin}", Expected: "${apiUrl}"`
      }]);
    });


    afterEach((flags) => {
      const { context } = flags;
      config.set('env', 'test'); // For got hooks only.
      context.model.propagateTesterMessage.restore();
    });
  });
});
