exports.lab = require('lab').script();

const { describe, it, before, beforeEach, afterEach } = exports.lab;

const { expect, fail } = require('code');
const sinon = require('sinon');
const rewire = require('rewire');
const readFileAsync = require('util').promisify(require('fs').readFile);
const config = require('config/config');
const log = require('purpleteam-logger').init(config.get('loggers.def'));

const apiUrl = config.get('purpleteamApi.url');
const buildUserConfigFilePath = config.get('buildUserConfig.fileUri');
const dashboard = require('src/view/dashboard');
const api = require('src/presenter/apiDecoratingAdapter');
const { MockEvent, EventSource } = require('mocksse');
const { TesterProgressRoutePrefix } = require('src/strings');
const Model = require('src/models/model');


describe('apiDecoratingAdapter', () => {
  before(async (flags) => {
    flags.context.buildUserConfigFileContent = await (async () => readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' }))();
  });
  describe('getTestPlans', () => {
    it('- should provide the dashboard with the test plan to display', async (flags) => {
      const { context: { buildUserConfigFileContent } } = flags;
      const rewiredApi = rewire('src/presenter/apiDecoratingAdapter');
      const configFileContents = await buildUserConfigFileContent;
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
      const revertRewiredApiRequest = rewiredApi.__set__('request', requestStub);

      const testPlanStub = sinon.stub(dashboard, 'testPlan');
      dashboard.testPlan = testPlanStub;
      const revertRewiredApiDashboard = rewiredApi.__set__('dashboard', dashboard);

      flags.onCleanup = () => {
        rewiredRequest.post.restore();
        dashboard.testPlan.restore();
        revertRewiredApiRequest();
        revertRewiredApiDashboard();
      };

      const currentNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'local';
      await rewiredApi.getTestPlans(configFileContents);
      process.env.NODE_ENV = currentNodeEnv;

      expect(testPlanStub.getCall(0).args[0]).to.equal(expectedArgPasssedToTestPlan);
    });
  });


  describe('postToApi', () => {
    const request = {
      uri: `${apiUrl}/testplan`,
      method: 'POST',
      json: true,
      body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger",\n        "expectedPageSourceSuccess": "Log Out"\n      },\n      "sutIp": "pt-sut-cont",\n      "sutPort": 4000,\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Found. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession",\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12235678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "website", "value": "https://purpleteam-labs.com", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "method": "POST",\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'text/plain',
        charset: 'utf-8'
      }
    };
    const requestMissingTypeOfTestSession = {
      uri: `${apiUrl}/testplan`,
      method: 'POST',
      json: true,
      body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger",\n        "expectedPageSourceSuccess": "Log Out"\n      },\n      "sutIp": "pt-sut-cont",\n      "sutPort": 4000,\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Found. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12235678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "website", "value": "https://purpleteam-labs.com", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "method": "POST",\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'text/plain',
        charset: 'utf-8'
      }
    };
    const requestMissingComma = {
      uri: `${apiUrl}/testplan`,
      method: 'POST',
      json: true,
      body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger",\n        "expectedPageSourceSuccess": "Log Out"\n      },\n      "sutIp": "pt-sut-cont",\n      "sutPort": 4000,\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Found. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession"\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12235678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "website", "value": "https://purpleteam-labs.com", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "method": "POST",\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'text/plain',
        charset: 'utf-8'
      }
    };


    beforeEach(async (flags) => {
      const { context } = flags;
      context.rewiredApi = rewire('src/presenter/apiDecoratingAdapter');

      context.rewiredRequest = context.rewiredApi.__get__('request');
      context.requestStub = sinon.stub(context.rewiredRequest, 'post');

      context.revertRewiredApiRequest = context.rewiredApi.__set__('request', context.requestStub);

      context.log = log;
      context.critStub = sinon.stub(context.log, 'crit');
      context.log.crit = context.critStub;

      context.revertRewiredApiLog = context.rewiredApi.__set__('log', context.log);
    });


    // it('- on - socket hang up - should throw error - backendTookToLong', () => {
    //   // Todo: KC: Need to reproduce error state.
    // });


    it('- on - connect EHOSTUNREACH - should throw error - backendUnreachable', async (flags) => {
      const { context: { buildUserConfigFileContent, rewiredApi, requestStub, critStub } } = flags;
      const configFileContents = await buildUserConfigFileContent;
      const error = {
        name: 'RequestError',
        message: 'Error: connect EHOSTUNREACH 127.0.0.1:2000',
        cause: {
          code: 'EHOSTUNREACH',
          errno: 'EHOSTUNREACH',
          syscall: 'connect',
          address: '127.0.0.1',
          port: 2000
        },
        error: {
          code: 'EHOSTUNREACH',
          errno: 'EHOSTUNREACH',
          syscall: 'connect',
          address: '127.0.0.1',
          port: 2000
        },
        options: {
          uri: 'http://127.0.0.1:2000/testplan',
          method: 'POST',
          json: true,
          body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger",\n        "expectedPageSourceSuccess": "Log Out"\n      },\n      "sutIp": "pt-sut-cont",\n      "sutPort": 4000,\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Found. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession",\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12235678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "website", "value": "https://purpleteam-labs.com", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "method": "POST",\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'text/plain',
            charset: 'utf-8'
          },
          simple: true,
          resolveWithFullResponse: false,
          transform2xxOnly: false
        }
      };
      requestStub.returns(Promise.reject(error));

      const currentNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'local';
      await rewiredApi.getTestPlans(configFileContents);
      process.env.NODE_ENV = currentNodeEnv;

      expect(requestStub.getCall(0).args[0]).to.equal(request);
      expect(critStub.getCall(0).args[0]).to.equal('Error occurred while attempting to communicate with the purpleteam orchestrator. Error was: "The purpleteam backend is currently unreachable".');
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });


    it('- on - ValidationError - should throw error - validationError', async (flags) => {
      // Lots of checking around the validation on the server side will be required.
      const { context: { rewiredApi, requestStub, critStub } } = flags;
      const configFileContents = await (async () => readFileAsync(`${process.cwd()}/testResources/jobs/job_0.1.0-alpha.1_missing_type_of_testSession`, { encoding: 'utf8' }))();
      const error = {
        name: 'StatusCodeError',
        statusCode: 400,
        message: `400 - {"statusCode":400,"error":"Bad Request","message":"[\n  {\n    "keyword": "required",\n    "dataPath": ".included[0]",\n    "schemaPath": "#/required",\n    "params": {\n      "missingProperty": "type"\n    },\n    "message": "should have required property 'type'"\n  }\n]","name":"ValidationError"}`, // eslint-disable-line quotes
        error: {
          statusCode: 400,
          error: 'Bad Request',
          message: `[
            {
              "keyword": "required",
              "dataPath": ".included[0]",
              "schemaPath": "#/required",
              "params": {
                "missingProperty": "type"
              },
              "message": "should have required property 'type'"
            }
          ]`,
          name: 'ValidationError'
        },
        options: {
          uri: 'http://127.0.0.1:2000/testplan',
          method: 'POST',
          json: true,
          body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger",\n        "expectedPageSourceSuccess": "Log Out"\n      },\n      "sutIp": "pt-sut-cont",\n      "sutPort": 4000,\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Found. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {      \n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12235678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "website", "value": "https://purpleteam-labs.com", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "method": "POST",\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'text/plain',
            charset: 'utf-8'
          },
          simple: true,
          resolveWithFullResponse: false,
          transform2xxOnly: false
        },
        response: {
          statusCode: 400,
          body: {
            statusCode: 400,
            error: 'Bad Request',
            message: `[
              {
                "keyword": "required",
                "dataPath": ".included[0]",
                "schemaPath": "#/required",
                "params": {
                  "missingProperty": "type"
                },
                "message": "should have required property 'type'"
              }
            ]`,
            name: 'ValidationError'
          },
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-cache',
            'content-length': '321',
            date: 'Wed, 15 Aug 2018 02:05:34 GMT',
            connection: 'close'
          },
          request: {
            uri: {
              protocol: 'http:',
              slashes: true,
              auth: null,
              host: '127.0.0.1:2000',
              port: '2000',
              hostname: '127.0.0.1',
              hash: null,
              search: null,
              query: null,
              pathname: '/testplan',
              path: '/testplan',
              href: 'http://127.0.0.1:2000/testplan'
            },
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.api+json',
              Accept: 'text/plain',
              charset: 'utf-8',
              'content-length': 2873
            }
          }
        }
      };
      requestStub.returns(Promise.reject(error));

      const currentNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'local';
      await rewiredApi.getTestPlans(configFileContents);
      process.env.NODE_ENV = currentNodeEnv;

      expect(requestStub.getCall(0).args[0]).to.equal(requestMissingTypeOfTestSession);
      expect(critStub.getCall(0).args[0]).to.equal(`Error occurred while attempting to communicate with the purpleteam orchestrator. Error was: Validation of the supplied build user config failed. Errors: [
            {
              "keyword": "required",
              "dataPath": ".included[0]",
              "schemaPath": "#/required",
              "params": {
                "missingProperty": "type"
              },
              "message": "should have required property 'type'"
            }
          ].`);
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });


    it('- on - SyntaxError - should throw error - syntaxError', async (flags) => {
      const { context: { rewiredApi, requestStub, critStub } } = flags;
      const configFileContents = await (async () => readFileAsync(`${process.cwd()}/testResources/jobs/job_0.1.0-alpha.1_missing_comma`, { encoding: 'utf8' }))();
      const error = {
        name: 'StatusCodeError',
        statusCode: 400,
        message: '400 - {"statusCode":400,"error":"Bad Request","message":"Unexpected string in JSON at position 810","name":"SyntaxError"}',
        error: {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Unexpected string in JSON at position 810',
          name: 'SyntaxError'
        },
        options: {
          uri: 'http://127.0.0.1:2000/testplan',
          method: 'POST',
          json: true,
          body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger",\n        "expectedPageSourceSuccess": "Log Out"\n      },\n      "sutIp": "pt-sut-cont",\n      "sutPort": 4000,\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Found. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession"\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12235678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "website", "value": "https://purpleteam-labs.com", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "method": "POST",\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'text/plain',
            charset: 'utf-8'
          },
          simple: true,
          resolveWithFullResponse: false,
          transform2xxOnly: false
        },
        response: {
          statusCode: 400,
          body: {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Unexpected string in JSON at position 810',
            name: 'SyntaxError'
          },
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-cache',
            'content-length': '115',
            date: 'Wed, 15 Aug 2018 06:39:11 GMT',
            connection: 'close'
          },
          request: {
            uri: {
              protocol: 'http:',
              slashes: true,
              auth: null,
              host: '127.0.0.1:2000',
              port: '2000',
              hostname: '127.0.0.1',
              hash: null,
              search: null,
              query: null,
              pathname: '/testplan',
              path: '/testplan',
              href: 'http://127.0.0.1:2000/testplan'
            },
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.api+json',
              Accept: 'text/plain',
              charset: 'utf-8',
              'content-length': 2900
            }
          }
        }
      };
      requestStub.returns(Promise.reject(error));

      const currentNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'local';
      await rewiredApi.getTestPlans(configFileContents);
      process.env.NODE_ENV = currentNodeEnv;

      expect(requestStub.getCall(0).args[0]).to.equal(requestMissingComma);
      expect(critStub.getCall(0).args[0]).to.equal('Error occurred while attempting to communicate with the purpleteam orchestrator. Error was: SyntaxError: Unexpected string in JSON at position 810.');
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });


    it('- on - 500 - should throw error - unknown', async (flags) => {
      const { context: { buildUserConfigFileContent, rewiredApi, requestStub, critStub } } = flags;
      const configFileContents = await buildUserConfigFileContent;
      const statusCodeError = {
        name: 'StatusCodeError',
        statusCode: 500,
        message: '500 - {"statusCode":500,"error":"Internal Server Error","message":"An internal server error occurred"}',
        error: {
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An internal server error occurred'
        },
        options: {
          uri: 'http://127.0.0.1:2000/testplan',
          method: 'POST',
          json: true,
          body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger",\n        "expectedPageSourceSuccess": "Log Out"\n      },\n      "sutIp": "pt-sut-cont",\n      "sutPort": 4000,\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Found. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession",\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12235678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "website", "value": "https://purpleteam-labs.com", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "method": "POST",\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'text/plain',
            charset: 'utf-8'
          },
          simple: true,
          resolveWithFullResponse: false,
          transform2xxOnly: false
        },
        response: {
          statusCode: 500,
          body: {
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An internal server error occurred'
          },
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-cache',
            'content-length': '96',
            date: 'Wed, 15 Aug 2018 01:15:04 GMT',
            connection: 'close'
          },
          request: {
            uri: {
              protocol: 'http:',
              slashes: true,
              auth: null,
              host: '127.0.0.1:2000',
              port: '2000',
              hostname: '127.0.0.1',
              hash: null,
              search: null,
              query: null,
              pathname: '/testplan',
              path: '/testplan',
              href: 'http://127.0.0.1:2000/testplan'
            },
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.api+json',
              Accept: 'text/plain',
              charset: 'utf-8',
              'content-length': 2901
            }
          }
        }
      };
      requestStub.returns(Promise.reject(statusCodeError));

      const currentNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'local';
      await rewiredApi.getTestPlans(configFileContents);
      process.env.NODE_ENV = currentNodeEnv;

      expect(requestStub.getCall(0).args[0]).to.equal(request);
      expect(critStub.getCall(0).args[0]).to.equal('Error occurred while attempting to communicate with the purpleteam orchestrator. Error was: "Unknown"');
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });


    afterEach((flags) => {
      const { context } = flags;
      context.revertRewiredApiRequest();
      context.revertRewiredApiLog();

      context.log.crit.restore();
      context.rewiredRequest.post.restore();
    });
  });


  describe('test and subscribeToTesterProgress', async () => {
    beforeEach(async (flags) => {
      const { context } = flags;
      context.request = {
        uri: `${apiUrl}/test`,
        method: 'POST',
        json: true,
        body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger",\n        "expectedPageSourceSuccess": "Log Out"\n      },\n      "sutIp": "pt-sut-cont",\n      "sutPort": 4000,\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Found. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession",\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12235678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "website", "value": "https://purpleteam-labs.com", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "method": "POST",\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'text/plain',
          charset: 'utf-8'
        }
      };
      context.rewiredApi = rewire('src/presenter/apiDecoratingAdapter');
      context.configFileContents = await context.buildUserConfigFileContent;

      context.rewiredRequest = context.rewiredApi.__get__('request');
      context.requestStub = sinon.stub(context.rewiredRequest, 'post');
    });


    it('- should subscribe to models tester events - should propagate initial tester responses from each tester to model - then verify event flow back through presenter and then to view', async (flags) => {
      const { context: { configFileContents, rewiredApi, request, rewiredRequest, requestStub } } = flags;
      const apiResponse = [
        {
          name: 'app',
          message: 'App tests are now running.'
        },
        {
          name: 'server',
          message: 'No server testing available currently. The server tester is currently in-active.'
        },
        {
          name: 'tls',
          message: 'No tls testing available currently. The tls tester is currently in-active.'
        }
      ];

      requestStub.returns(Promise.resolve(apiResponse));
      const revertRewiredApiRequest = rewiredApi.__set__('request', requestStub);

      const testStub = sinon.stub(dashboard, 'test');
      dashboard.test = testStub;

      const rewiredHandleModelTesterEvents = rewiredApi.__get__('handleModelTesterEvents');
      const handleModelTesterEventsSpy = sinon.spy(rewiredHandleModelTesterEvents);
      const revertRewiredApiHandleModelTesterEvents = rewiredApi.__set__('handleModelTesterEvents', handleModelTesterEventsSpy);

      const handleTesterProgressStub = sinon.stub(dashboard, 'handleTesterProgress');
      dashboard.handleTesterProgress = handleTesterProgressStub;

      const revertRewiredApiDashboard = rewiredApi.__set__('dashboard', dashboard);
      const revertRewiredApiApiUrl = rewiredApi.__set__('apiUrl', `${apiUrl}`);

      flags.onCleanup = () => {
        rewiredRequest.post.restore();
        dashboard.test.restore();
        dashboard.handleTesterProgress.restore();
        revertRewiredApiRequest();
        revertRewiredApiHandleModelTesterEvents();
        revertRewiredApiDashboard();
        revertRewiredApiApiUrl();
      };

      const currentNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'local';
      await rewiredApi.test(configFileContents);
      process.env.NODE_ENV = currentNodeEnv;

      expect(requestStub.getCall(0).args[0]).to.equal(request);
      expect(requestStub.callCount).to.equal(1);

      const expectedTesterSessions = [ // Taken from the model test
        { testerType: 'app', sessionId: 'lowPrivUser', threshold: 12 },
        { testerType: 'app', sessionId: 'adminUser', threshold: 0 },
        { testerType: 'server', sessionId: 'NA', threshold: 0 },
        { testerType: 'tls', sessionId: 'NA', threshold: 0 }
      ];

      expect(testStub.getCall(0).args[0]).to.equal(expectedTesterSessions);
      expect(testStub.callCount).to.equal(1);

      expect(handleModelTesterEventsSpy.callCount).to.equal(4);
      expect(handleTesterProgressStub.callCount).to.equal(4);

      expect(handleModelTesterEventsSpy.getCall(0).args).to.equal(['testerProgress', 'app', 'lowPrivUser', 'App tests are now running.']);
      expect(handleTesterProgressStub.getCall(0).args).to.equal(['app', 'lowPrivUser', 'App tests are now running.']);

      expect(handleModelTesterEventsSpy.getCall(1).args).to.equal(['testerProgress', 'app', 'adminUser', 'App tests are now running.']);
      expect(handleTesterProgressStub.getCall(1).args).to.equal(['app', 'adminUser', 'App tests are now running.']);

      expect(handleModelTesterEventsSpy.getCall(2).args).to.equal(['testerProgress', 'server', 'NA', 'No server testing available currently. The server tester is currently in-active.']);
      expect(handleTesterProgressStub.getCall(2).args).to.equal(['server', 'NA', 'No server testing available currently. The server tester is currently in-active.']);

      expect(handleModelTesterEventsSpy.getCall(3).args).to.equal(['testerProgress', 'tls', 'NA', 'No tls testing available currently. The tls tester is currently in-active.']);
      expect(handleTesterProgressStub.getCall(3).args).to.equal(['tls', 'NA', 'No tls testing available currently. The tls tester is currently in-active.']);
    });


    it('- should subscribe to models tester events - should propagate initial tester responses from each tester to model, even if app tester is offline - then verify event flow back through presenter and then to view', async (flags) => {
      const { context: { configFileContents, rewiredApi, request, rewiredRequest, requestStub } } = flags;
      const apiResponse = [
        // Simulate no response from app tester to orchestrator.
        // {
        //   name: 'app',
        //   message: 'App tests are now running.'
        // },
        {
          name: 'server',
          message: 'No server testing available currently. The server tester is currently in-active.'
        },
        {
          name: 'tls',
          message: 'No tls testing available currently. The tls tester is currently in-active.'
        }
      ];

      requestStub.returns(Promise.resolve(apiResponse));
      const revertRewiredApiRequest = rewiredApi.__set__('request', requestStub);

      const testStub = sinon.stub(dashboard, 'test');
      dashboard.test = testStub;

      const rewiredHandleModelTesterEvents = rewiredApi.__get__('handleModelTesterEvents');
      const handleModelTesterEventsSpy = sinon.spy(rewiredHandleModelTesterEvents);
      const revertRewiredApiHandleModelTesterEvents = rewiredApi.__set__('handleModelTesterEvents', handleModelTesterEventsSpy);

      const handleTesterProgressStub = sinon.stub(dashboard, 'handleTesterProgress');
      dashboard.handleTesterProgress = handleTesterProgressStub;

      const revertRewiredApiDashboard = rewiredApi.__set__('dashboard', dashboard);
      const revertRewiredApiApiUrl = rewiredApi.__set__('apiUrl', `${apiUrl}`);

      flags.onCleanup = () => {
        rewiredRequest.post.restore();
        dashboard.test.restore();
        dashboard.handleTesterProgress.restore();
        revertRewiredApiRequest();
        revertRewiredApiHandleModelTesterEvents();
        revertRewiredApiDashboard();
        revertRewiredApiApiUrl();
      };

      const currentNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'local';
      await rewiredApi.test(configFileContents);
      process.env.NODE_ENV = currentNodeEnv;

      expect(requestStub.getCall(0).args[0]).to.equal(request);
      expect(requestStub.callCount).to.equal(1);

      const expectedTesterSessions = [ // Taken from the model test
        { testerType: 'app', sessionId: 'lowPrivUser', threshold: 12 },
        { testerType: 'app', sessionId: 'adminUser', threshold: 0 },
        { testerType: 'server', sessionId: 'NA', threshold: 0 },
        { testerType: 'tls', sessionId: 'NA', threshold: 0 }
      ];

      expect(testStub.getCall(0).args[0]).to.equal(expectedTesterSessions);
      expect(testStub.callCount).to.equal(1);

      expect(handleModelTesterEventsSpy.callCount).to.equal(4);
      expect(handleTesterProgressStub.callCount).to.equal(4);

      expect(handleModelTesterEventsSpy.getCall(0).args).to.equal(['testerProgress', 'app', 'lowPrivUser', '"app" tester for session with Id "lowPrivUser" doesn\'t currently appear to be online']);
      expect(handleTesterProgressStub.getCall(0).args).to.equal(['app', 'lowPrivUser', '"app" tester for session with Id "lowPrivUser" doesn\'t currently appear to be online']);

      expect(handleModelTesterEventsSpy.getCall(1).args).to.equal(['testerProgress', 'app', 'adminUser', '"app" tester for session with Id "adminUser" doesn\'t currently appear to be online']);
      expect(handleTesterProgressStub.getCall(1).args).to.equal(['app', 'adminUser', '"app" tester for session with Id "adminUser" doesn\'t currently appear to be online']);

      expect(handleModelTesterEventsSpy.getCall(2).args).to.equal(['testerProgress', 'server', 'NA', 'No server testing available currently. The server tester is currently in-active.']);
      expect(handleTesterProgressStub.getCall(2).args).to.equal(['server', 'NA', 'No server testing available currently. The server tester is currently in-active.']);

      expect(handleModelTesterEventsSpy.getCall(3).args).to.equal(['testerProgress', 'tls', 'NA', 'No tls testing available currently. The tls tester is currently in-active.']);
      expect(handleTesterProgressStub.getCall(3).args).to.equal(['tls', 'NA', 'No tls testing available currently. The tls tester is currently in-active.']);
    });
  });


  describe('subscribeToTesterProgress SSE and handlers', async () => {
    before(async (flags) => {
      flags.context.apiResponse = [
        {
          name: 'app',
          message: 'App tests are now running.'
        },
        {
          name: 'server',
          message: 'No server testing available currently. The server tester is currently in-active.'
        },
        {
          name: 'tls',
          message: 'No tls testing available currently. The tls tester is currently in-active.'
        }
      ];
    });


    beforeEach(async (flags) => {
      const { context, context: { apiResponse } } = flags;
      const configFileContents = await context.buildUserConfigFileContent;
      context.model = new Model(configFileContents);
      const rewiredApi = rewire('src/presenter/apiDecoratingAdapter');

      context.revertRewiredApiApiResponse = rewiredApi.__set__('apiResponse', apiResponse);
      context.revertRewiredApiEventSource = rewiredApi.__set__('EventSource', EventSource);

      context.rewiredSubscribeToTesterProgress = rewiredApi.__get__('subscribeToTesterProgress');
      context.rewiredApi = rewiredApi;
    });


    it('- given a mock event for each of the available testers sessions - given invocation of all the tester events - relevant handler instances should be run', async (flags) => {
      const { context: { model, rewiredSubscribeToTesterProgress, rewiredApi } } = flags;
      const numberOfEvents = 6;
      new MockEvent({ // eslint-disable-line no-new
        url: `${apiUrl}/${TesterProgressRoutePrefix}/app/lowPrivUser`,
        setInterval: 1,
        responses: [
          { lastEventId: 'one', type: 'testerProgress', data: { progress: 'Initialising subscription to "app-lowPrivUser" channel for the event "testerProgress"' } },
          { lastEventId: 'two', type: 'testerPctComplete', data: { pctComplete: 8 } },
          { lastEventId: 'three', type: 'testerBugCount', data: { bugCount: 3 } }
        ]
      });
      new MockEvent({ // eslint-disable-line no-new
        url: `${apiUrl}/${TesterProgressRoutePrefix}/app/adminUser`,
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

        rewiredSubscribeToTesterProgress(model);
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
      context.revertRewiredApiApiResponse();
      context.revertRewiredApiEventSource();
    });
  });


  describe('getBuildUserConfigFile', async () => {
    before(async (flags) => {
      flags.context.buildUserConfigFileContent = await (async () => readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' }))();
    });
    it('- should return the build user config file contents', async ({ context }) => {
      const { buildUserConfigFileContent } = context;
      const buildUserConfigFileContents = await api.getBuildUserConfigFile(buildUserConfigFilePath);
      expect(buildUserConfigFileContents).to.equal(buildUserConfigFileContent);
    });
  });


  describe('handleModelTesterEvents', async () => {
    beforeEach(async (flags) => {
      const { context } = flags;
      context.rewiredApi = rewire('src/presenter/apiDecoratingAdapter');
    });
    it('- given event `testerProgress` handleTesterProgress of the view should be called with correct arguments', async (flags) => {
      const { context: { rewiredApi } } = flags;
      const handleTesterProgressStub = sinon.stub(dashboard, 'handleTesterProgress');
      dashboard.handleTesterProgress = handleTesterProgressStub;
      const revertRewiredApiDashboard = rewiredApi.__set__('dashboard', dashboard);
      const rewiredHandleModelTesterEvents = rewiredApi.__get__('handleModelTesterEvents');

      flags.onCleanup = () => {
        dashboard.handleTesterProgress.restore();
        revertRewiredApiDashboard();
      };

      const eventName = 'testerProgress';
      const testerType = 'app';
      const sessionId = 'lowPrivUser';
      const message = 'App tests are now running.';
      const parameters = [testerType, sessionId, message];
      rewiredHandleModelTesterEvents(eventName, testerType, sessionId, message);

      expect(handleTesterProgressStub.callCount).to.equal(1);
      expect(handleTesterProgressStub.getCall(0).args).to.equal(parameters);
    });


    it('- given event `testerPctComplete` handleTesterPctComplete of the view should be called with correct arguments', async (flags) => {
      const { context: { rewiredApi } } = flags;
      const handleTesterPctCompleteStub = sinon.stub(dashboard, 'handleTesterPctComplete');
      dashboard.handleTesterPctComplete = handleTesterPctCompleteStub;
      const revertRewiredApiDashboard = rewiredApi.__set__('dashboard', dashboard);
      const rewiredHandleModelTesterEvents = rewiredApi.__get__('handleModelTesterEvents');

      flags.onCleanup = () => {
        dashboard.handleTesterPctComplete.restore();
        revertRewiredApiDashboard();
      };

      const eventName = 'testerPctComplete';
      const testerType = 'app';
      const sessionId = 'lowPrivUser';
      const message = 11;
      const parameters = [testerType, sessionId, message];
      rewiredHandleModelTesterEvents(eventName, testerType, sessionId, message);

      expect(handleTesterPctCompleteStub.callCount).to.equal(1);
      expect(handleTesterPctCompleteStub.getCall(0).args).to.equal(parameters);
    });


    it('- given event `testerBugCount` handleTesterBugCount of the view should be called with correct arguments', async (flags) => {
      const { context: { rewiredApi } } = flags;
      const handleTesterBugCountStub = sinon.stub(dashboard, 'handleTesterBugCount');
      dashboard.handleTesterBugCount = handleTesterBugCountStub;
      const revertRewiredApiDashboard = rewiredApi.__set__('dashboard', dashboard);
      const rewiredHandleModelTesterEvents = rewiredApi.__get__('handleModelTesterEvents');

      flags.onCleanup = () => {
        dashboard.handleTesterBugCount.restore();
        revertRewiredApiDashboard();
      };

      const eventName = 'testerBugCount';
      const testerType = 'app';
      const sessionId = 'lowPrivUser';
      const message = 56;
      const parameters = [testerType, sessionId, message];
      rewiredHandleModelTesterEvents(eventName, testerType, sessionId, message);

      expect(handleTesterBugCountStub.callCount).to.equal(1);
      expect(handleTesterBugCountStub.getCall(0).args).to.equal(parameters);
    });
  });


  describe('handleServerSentTesterEvents', () => {
    beforeEach(async (flags) => {
      const { context } = flags;
      const configFileContents = await context.buildUserConfigFileContent;
      context.model = new Model(configFileContents);
      context.modelPropagateTesterMessageStub = sinon.stub(context.model, 'propagateTesterMessage');

      context.rewiredApi = rewire('src/presenter/apiDecoratingAdapter');
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
      const warningStub = sinon.stub(log, 'warning');
      log.warning = warningStub;
      const revertRewiredApiLog = rewiredApi.__set__('log', log);

      const event = {
        type: 'testerProgress',
        data: '{"progress":null}',
        lastEventId: '1535354779913',
        origin: apiUrl
      };
      const testerNameAndSession = { sessionId: 'lowPrivUser', testerType: 'app' };

      flags.onCleanup = () => {
        log.warning.restore();
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
      context.model.propagateTesterMessage.restore();
    });
  });
});
