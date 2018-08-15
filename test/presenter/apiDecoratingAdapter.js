exports.lab = require('lab').script();

const { describe, it, before, beforeEach } = exports.lab;

const { expect } = require('code');
const sinon = require('sinon');
const rewire = require('rewire');
const readFileAsync = require('util').promisify(require('fs').readFile);
const config = require('config/config');
const log = require('purpleteam-logger').init(config.get('logger'));

const buildUserConfigFilePath = config.get('buildUserConfig.fileUri');
const dashboard = require('src/view/dashboard');
const api = require('src/presenter/apiDecoratingAdapter');

describe('apiDecoratingAdapter', () => {
  describe('getTestPlans', () => {
    before(async (flags) => {
      flags.context.buildUserConfigFileContent = await (async () => readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' }))();
    });
    it('- should provide the dashboard with the test plan to display', async (flags) => {
      const { context: { buildUserConfigFileContent } } = flags;
      const rewiredApi = rewire('src/presenter/apiDecoratingAdapter');
      const configFileContents = await buildUserConfigFileContent;
      rewiredApi.init(log);
      const apiResponse = [{
        name: 'app',
        message: `@app_scan
        Feature: Web application free of security vulnerabilities known to Zap
        
        # Before hooks are run befroe Background
        
        Background:
          Given a new test session based on each build user supplied testSession
          And each build user supplied route of each testSession is navigated
          And a new scanning session based on each build user supplied testSession
          And the application is spidered for each testSession
          And all active scanners are disabled
        
        Scenario: The application should not contain vulnerabilities known to Zap that exceed the build user defined threshold
          Given all active scanners are enabled 
          When the active scan is run
          Then the vulnerability count should not exceed the build user defined threshold of vulnerabilities known to Zap
        
          
        
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
              |  12 |         5 |     17 |`
      }, {
        name: 'server',
        message: 'No test plan available for the server tester. The server tester is currently in-active.'
      }, {
        name: 'tls',
        message: 'No test plan available for the tls tester. The tls tester is currently in-active.'
      }];

      const expectedArgPasssedToTestPlan = [{
        name: 'app',
        message: `@app_scan
        Feature: Web application free of security vulnerabilities known to Zap
        
        # Before hooks are run befroe Background
        
        Background:
          Given a new test session based on each build user supplied testSession
          And each build user supplied route of each testSession is navigated
          And a new scanning session based on each build user supplied testSession
          And the application is spidered for each testSession
          And all active scanners are disabled
        
        Scenario: The application should not contain vulnerabilities known to Zap that exceed the build user defined threshold
          Given all active scanners are enabled 
          When the active scan is run
          Then the vulnerability count should not exceed the build user defined threshold of vulnerabilities known to Zap
        
          
        
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
              |  12 |         5 |     17 |`
      }, {
        name: 'server',
        message: 'No test plan available for the server tester. The server tester is currently in-active.'
      }, {
        name: 'tls',
        message: 'No test plan available for the tls tester. The tls tester is currently in-active.'
      }];

      const rewiredRequest = rewiredApi.__get__('request');
      const requestStub = sinon.stub(rewiredRequest, 'post');
      requestStub.returns(Promise.resolve(apiResponse));
      rewiredApi.__set__('request', requestStub);

      flags.onCleanup = () => { rewiredRequest.post.restore(); };

      const testPlanStub = sinon.stub(dashboard, 'testPlan');
      dashboard.testPlan = testPlanStub;
      rewiredApi.__set__('dashboard', dashboard);

      await rewiredApi.getTestPlans(configFileContents);

      expect(testPlanStub.getCall(0).args[0]).to.equal(expectedArgPasssedToTestPlan);
    });
  });


  describe('postToApi', () => {
    beforeEach(async (flags) => {
      flags.context.buildUserConfigFileContent = await (async () => readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' }))();
      flags.context.rewiredApi = rewire('src/presenter/apiDecoratingAdapter');
    });
    it(() => {});
    it('- on - connect ECONNREFUSED - should throw error - backendUnreachable', async (flags) => {
      const { context: { buildUserConfigFileContent, rewiredApi } } = flags;
      const critStub = sinon.stub(log, 'crit');
      log.crit = critStub;
      rewiredApi.init(log);
      const configFileContents = await buildUserConfigFileContent;

      const rewiredRequest = rewiredApi.__get__('request');
      const requestStub = sinon.stub(rewiredRequest, 'post');

      const error = {
        name: 'RequestError',
        message: 'Error: connect ECONNREFUSED 127.0.0.1:2000',
        cause: {
          code: 'ECONNREFUSED',
          errno: 'ECONNREFUSED',
          syscall: 'connect',
          address: '127.0.0.1',
          port: 2000
        },
        error: {
          code: 'ECONNREFUSED',
          errno: 'ECONNREFUSED',
          syscall: 'connect',
          address: '127.0.0.1',
          port: 2000
        },
        options: {
          uri: 'http://127.0.0.1:2000/testplan',
          method: 'POST',
          json: true,
          body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger"\n      },\n      "sutIp": "172.17.0.1",\n      "sutPort": "4000",\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Moved Temporarily. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession",\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12/23/5678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'text/plain'
          },
          simple: true,
          resolveWithFullResponse: false,
          transform2xxOnly: false
        }
      };
      requestStub.returns(Promise.reject(error));
      rewiredApi.__set__('request', requestStub);

      flags.onCleanup = () => {
        log.crit.restore();
        rewiredRequest.post.restore();
      };

      await rewiredApi.getTestPlans(configFileContents);

      expect(requestStub.getCall(0).args[0]).to.equal({
        uri: 'https://240.0.0.0:2000/testplan',
        method: 'POST',
        json: true,
        body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger"\n      },\n      "sutIp": "172.17.0.1",\n      "sutPort": "4000",\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Moved Temporarily. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession",\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12/23/5678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'text/plain'
        }
      });
      expect(critStub.getCall(0).args[0]).to.equal('Error occured while attempting to communicate with the purpleteam SaaS. Error was: "The purpleteam backend is currently unreachable".');
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1).args[0]).to.equal('There didn\'t appear to be a response from the purpleteam API');
      expect(critStub.getCall(1).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
    });
  });


  //  describe('test', async () => {
  //    it('- should', async () => {
  //      expect(true).to.equal(true);
  //    });
  //  });

  describe('getBuildUserConfigFile', async () => {
    before(async (flags) => {
      flags.context.buildUserConfigFileContent = await (async () => readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' }))();
    });
    it('- should return the build user config file contents', async ({ context }) => {
      const { buildUserConfigFileContent } = context;
      api.init(log);
      const buildUserConfigFileContents = await api.getBuildUserConfigFile(buildUserConfigFilePath);
      expect(buildUserConfigFileContents).to.equal(buildUserConfigFileContent);
    });
  });
});
