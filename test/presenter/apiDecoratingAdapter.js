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

      const testPlanStub = sinon.stub(dashboard, 'testPlan');
      dashboard.testPlan = testPlanStub;
      rewiredApi.__set__('dashboard', dashboard);

      flags.onCleanup = () => {
        rewiredRequest.post.restore();
        dashboard.testPlan.restore();
      };

      await rewiredApi.getTestPlans(configFileContents);

      expect(testPlanStub.getCall(0).args[0]).to.equal(expectedArgPasssedToTestPlan);
    });
  });


  describe('postToApi', () => {
    const request = {
      uri: 'https://240.0.0.0:2000/testplan',
      method: 'POST',
      json: true,
      body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger"\n      },\n      "sutIp": "172.17.0.1",\n      "sutPort": "4000",\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Moved Temporarily. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession",\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12/23/5678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'text/plain'
      }
    };
    const requestMissingTypeOfTestSession = {
      uri: 'https://240.0.0.0:2000/testplan',
      method: 'POST',
      json: true,
      body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger"\n      },\n      "sutIp": "172.17.0.1",\n      "sutPort": "4000",\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Moved Temporarily. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12/23/5678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'text/plain'
      }
    };
    const requestMissingComma = {
      uri: 'https://240.0.0.0:2000/testplan',
      method: 'POST',
      json: true,
      body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger"\n      },\n      "sutIp": "172.17.0.1",\n      "sutPort": "4000",\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Moved Temporarily. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession"\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12/23/5678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'text/plain'
      }
    };


    before(async (flags) => {
      flags.context.buildUserConfigFileContent = await (async () => readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' }))();
    });


    beforeEach(async (flags) => {
      flags.context.rewiredApi = rewire('src/presenter/apiDecoratingAdapter');
    });


    it('- on - socket hang up - should throw error - backendTookToLong', () => {
      // Todo: KC: Need to reproduce error state.
    });


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

      expect(requestStub.getCall(0).args[0]).to.equal(request);
      expect(critStub.getCall(0).args[0]).to.equal('Error occured while attempting to communicate with the purpleteam SaaS. Error was: "The purpleteam backend is currently unreachable".');
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });


    it('- on - ValidationError - should throw error - validationError', async (flags) => {
      // Lots of checking around the validation on the server side will be required.
      const { context: { rewiredApi } } = flags;
      const critStub = sinon.stub(log, 'crit');
      log.crit = critStub;
      rewiredApi.init(log);
      const configFileContents = await (async () => readFileAsync(`${process.cwd()}/testResources/jobs/job_0.1.0-alpha.1_missing_type_of_testSession`, { encoding: 'utf8' }))();

      const rewiredRequest = rewiredApi.__get__('request');
      const requestStub = sinon.stub(rewiredRequest, 'post');

      const error = {
        name: 'StatusCodeError',
        statusCode: 400,
        message: '400 - {"statusCode":400,"error":"Bad Request","message":"child \\"included\\" fails because [\\"included\\" must contain 3 items]","name":"ValidationError"}',
        error: {
          statusCode: 400,
          error: 'Bad Request',
          message: 'child "included" fails because ["included" must contain 3 items]',
          name: 'ValidationError'
        },
        options: {
          uri: 'http://127.0.0.1:2000/testplan',
          method: 'POST',
          json: true,
          body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger"\n      },\n      "sutIp": "172.17.0.1",\n      "sutPort": "4000",\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Moved Temporarily. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {      \n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12/23/5678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'text/plain'
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
            message: 'child "included" fails because ["included" must contain 3 items]',
            name: 'ValidationError'
          },
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-cache',
            'content-length': '146',
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
              'content-length': 2873
            }
          }
        }
      };
      requestStub.returns(Promise.reject(error));
      rewiredApi.__set__('request', requestStub);

      flags.onCleanup = () => {
        log.crit.restore();
        rewiredRequest.post.restore();
      };

      await rewiredApi.getTestPlans(configFileContents);

      expect(requestStub.getCall(0).args[0]).to.equal(requestMissingTypeOfTestSession);
      expect(critStub.getCall(0).args[0]).to.equal('Error occured while attempting to communicate with the purpleteam SaaS. Error was: Validation of the supplied build user config failed: child "included" fails because ["included" must contain 3 items].');
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });


    it('- on - SyntaxError - should throw error - syntaxError', async (flags) => {
      const { context: { rewiredApi } } = flags;
      const critStub = sinon.stub(log, 'crit');
      log.crit = critStub;
      rewiredApi.init(log);
      const configFileContents = await (async () => readFileAsync(`${process.cwd()}/testResources/jobs/job_0.1.0-alpha.1_missing_comma`, { encoding: 'utf8' }))();

      const rewiredRequest = rewiredApi.__get__('request');
      const requestStub = sinon.stub(rewiredRequest, 'post');

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
          body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger"\n      },\n      "sutIp": "172.17.0.1",\n      "sutPort": "4000",\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Moved Temporarily. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession"\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12/23/5678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'text/plain'
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
              'content-length': 2900
            }
          }
        }
      };
      requestStub.returns(Promise.reject(error));
      rewiredApi.__set__('request', requestStub);

      flags.onCleanup = () => {
        log.crit.restore();
        rewiredRequest.post.restore();
      };

      await rewiredApi.getTestPlans(configFileContents);

      expect(requestStub.getCall(0).args[0]).to.equal(requestMissingComma);
      expect(critStub.getCall(0).args[0]).to.equal('Error occured while attempting to communicate with the purpleteam SaaS. Error was: SyntaxError: Unexpected string in JSON at position 810.');
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });


    it('- on - 500 - should throw error - unknown', async (flags) => {
      const { context: { buildUserConfigFileContent, rewiredApi } } = flags;
      const critStub = sinon.stub(log, 'crit');
      log.crit = critStub;
      rewiredApi.init(log);
      const configFileContents = await buildUserConfigFileContent;

      const rewiredRequest = rewiredApi.__get__('request');
      const requestStub = sinon.stub(rewiredRequest, 'post');

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
          body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger"\n      },\n      "sutIp": "172.17.0.1",\n      "sutPort": "4000",\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Moved Temporarily. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession",\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12/23/5678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'text/plain'
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
              'content-length': 2901
            }
          }
        }
      };
      requestStub.returns(Promise.reject(statusCodeError));
      rewiredApi.__set__('request', requestStub);

      flags.onCleanup = () => {
        log.crit.restore();
        rewiredRequest.post.restore();
      };

      await rewiredApi.getTestPlans(configFileContents);

      expect(requestStub.getCall(0).args[0]).to.equal(request);
      expect(critStub.getCall(0).args[0]).to.equal('Error occured while attempting to communicate with the purpleteam SaaS. Error was: "Unknown"');
      expect(critStub.getCall(0).args[1]).to.equal({ tags: ['apiDecoratingAdapter'] });
      expect(critStub.getCall(1)).to.equal(null);
    });
  });


  describe('test', async () => {
    before(async (flags) => {
      flags.context.buildUserConfigFileContent = await (async () => readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' }))();

      flags.context.request = {
        uri: 'https://240.0.0.0:2000/test',
        method: 'POST',
        json: true,
        body: '{\n  "data": {\n    "type": "testRun",\n    "attributes": {      \n      "version": "0.1.0-alpha.1",\n      "sutAuthentication": {\n        "route": "/login",\n        "usernameFieldLocater": "userName",\n        "passwordFieldLocater": "password",\n        "submit": "btn btn-danger"\n      },\n      "sutIp": "172.17.0.1",\n      "sutPort": "4000",\n      "sutProtocol": "http",\n      "browser": "chrome",\n      "loggedInIndicator": "<p>Moved Temporarily. Redirecting to <a href=\\"\\/dashboard\\">\\/dashboard<\\/a><\\/p>",\n      "reportFormats": ["html", "json", "md"]\n    },\n    "relationships": {\n      "data": [{\n        "type": "testSession",\n        "id": "lowPrivUser"\n      },\n      {\n        "type": "testSession",\n        "id": "adminUser"\n      }]\n    }\n  },\n  "included": [\n    {\n      "type": "testSession",\n      "id": "lowPrivUser",\n      "attributes": {\n        "username": "user1",\n        "password": "User1_123",\n        "aScannerAttackStrength": "HIGH",\n        "aScannerAlertThreshold": "LOW",\n        "alertThreshold": 12\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "testSession",\n      "id": "adminUser",\n      "attributes": {\n        "username": "admin",\n        "password": "Admin_123"\n      },\n      "relationships": {\n        "data": [{\n          "type": "route",\n          "id": "/memos"\n        },\n        {\n          "type": "route",\n          "id": "/profile"\n        }]\n      }\n    },\n    {\n      "type": "route",\n      "id": "/profile",\n      "attributes": {\n        "attackFields": [\n          {"name": "firstName", "value": "PurpleJohn", "visible": true},\n          {"name": "lastName", "value": "PurpleDoe", "visible": true},\n          {"name": "ssn", "value": "PurpleSSN", "visible": true},\n          {"name": "dob", "value": "12/23/5678", "visible": true},\n          {"name": "bankAcc", "value": "PurpleBankAcc", "visible": true},\n          {"name": "bankRouting", "value": "0198212#", "visible": true},\n          {"name": "address", "value": "PurpleAddress", "visible": true},\n          {"name": "_csrf", "value": ""},\n          {"name": "submit", "value": ""}\n        ],\n        "method": "POST",\n        "submit": "submit"\n      }\n    },\n    {\n      "type": "route",\n      "id": "/memos",\n      "attributes": {\n        "attackFields": [\n          {"name": "memo", "value": "PurpleMemo", "visible": true}\n        ],\n        "submit": "btn btn-primary"\n      }\n    }\n  ]\n}\n',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'text/plain'
        }
      };
    });
    it('- should subscribe to models tester events - should propagate initial SSEs for each tester - then verify event flow back through presenter and then to view', async (flags) => {
      const { context: { buildUserConfigFileContent, request } } = flags;
      const rewiredApi = rewire('src/presenter/apiDecoratingAdapter');
      const configFileContents = await buildUserConfigFileContent;
      rewiredApi.init(log);
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

      const rewiredRequest = rewiredApi.__get__('request');
      const requestStub = sinon.stub(rewiredRequest, 'post');
      requestStub.returns(Promise.resolve(apiResponse));
      rewiredApi.__set__('request', requestStub);

      const testStub = sinon.stub(dashboard, 'test');
      dashboard.test = testStub;

      const rewiredTesterEventHandler = rewiredApi.__get__('testerEventHandler');
      const testerEventHandlerSpy = sinon.spy(rewiredTesterEventHandler);
      rewiredApi.__set__('testerEventHandler', testerEventHandlerSpy);

      const handleTesterProgressStub = sinon.stub(dashboard, 'handleTesterProgress');
      dashboard.handleTesterProgress = handleTesterProgressStub;

      // const handleTesterPctCompleteStub = sinon.stub(dashboard, 'handleTesterPctComplete');
      // dashboard.handleTesterPctComplete = handleTesterPctCompleteStub;

      // const handleTesterBugCountStub = sinon.stub(dashboard, 'handleTesterBugCount');
      // dashboard.handleTesterBugCount = handleTesterBugCountStub;

      rewiredApi.__set__('dashboard', dashboard);


      flags.onCleanup = () => {
        rewiredRequest.post.restore();
        dashboard.test.restore();
        dashboard.handleTesterProgress.restore();
        // dashboard.handleTesterPctComplete.restore();
        // dashboard.handleTesterBugCount.restore();
      };

      await rewiredApi.test(configFileContents);

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

      // Setup expects for:
      //   params to testerEventHandlerSpy, and number of invocations.
      //   params to dashboard's handleTesterProgressStub, and number of invocations.
      //   params to dashboard's handleTesterPctCompleteStub, and number of invocations.
      //   params to dashboard's handleTesterBugCountStub, and number of invocations.

      expect(testerEventHandlerSpy.callCount).to.equal(4);
      expect(handleTesterProgressStub.callCount).to.equal(4);

      expect(testerEventHandlerSpy.getCall(0).args).to.equal(['testerProgress', 'app', 'lowPrivUser', 'App tests are now running.']);
      expect(handleTesterProgressStub.getCall(0).args).to.equal(['app', 'lowPrivUser', 'App tests are now running.']);

      expect(testerEventHandlerSpy.getCall(1).args).to.equal(['testerProgress', 'app', 'adminUser', 'App tests are now running.']);
      expect(handleTesterProgressStub.getCall(1).args).to.equal(['app', 'adminUser', 'App tests are now running.']);

      expect(testerEventHandlerSpy.getCall(2).args).to.equal(['testerProgress', 'server', 'NA', 'No server testing available currently. The server tester is currently in-active.']);
      expect(handleTesterProgressStub.getCall(2).args).to.equal(['server', 'NA', 'No server testing available currently. The server tester is currently in-active.']);

      expect(testerEventHandlerSpy.getCall(3).args).to.equal(['testerProgress', 'tls', 'NA', 'No tls testing available currently. The tls tester is currently in-active.']);
      expect(handleTesterProgressStub.getCall(3).args).to.equal(['tls', 'NA', 'No tls testing available currently. The tls tester is currently in-active.']);
    });


    it('- should subscribe to models tester events - should propagate initial SSEs for each tester, even if app tester is offline - then verify event flow back through presenter and then to view', async (flags) => {
      debugger; // eslint-disable-line
      const { context: { buildUserConfigFileContent, request } } = flags;
      const rewiredApi = rewire('src/presenter/apiDecoratingAdapter');
      const configFileContents = await buildUserConfigFileContent;
      rewiredApi.init(log);
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

      const rewiredRequest = rewiredApi.__get__('request');
      const requestStub = sinon.stub(rewiredRequest, 'post');
      requestStub.returns(Promise.resolve(apiResponse));
      rewiredApi.__set__('request', requestStub);

      const testStub = sinon.stub(dashboard, 'test');
      dashboard.test = testStub;

      const rewiredTesterEventHandler = rewiredApi.__get__('testerEventHandler');
      const testerEventHandlerSpy = sinon.spy(rewiredTesterEventHandler);
      rewiredApi.__set__('testerEventHandler', testerEventHandlerSpy);

      const handleTesterProgressStub = sinon.stub(dashboard, 'handleTesterProgress');
      dashboard.handleTesterProgress = handleTesterProgressStub;

      // const handleTesterPctCompleteStub = sinon.stub(dashboard, 'handleTesterPctComplete');
      // dashboard.handleTesterPctComplete = handleTesterPctCompleteStub;

      // const handleTesterBugCountStub = sinon.stub(dashboard, 'handleTesterBugCount');
      // dashboard.handleTesterBugCount = handleTesterBugCountStub;

      rewiredApi.__set__('dashboard', dashboard);


      flags.onCleanup = () => {
        rewiredRequest.post.restore();
        dashboard.test.restore();
        dashboard.handleTesterProgress.restore();
        // dashboard.handleTesterPctComplete.restore();
        // dashboard.handleTesterBugCount.restore();
      };

      await rewiredApi.test(configFileContents);

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

      // Setup expects for:
      //   params to testerEventHandlerSpy, and number of invocations.
      //   params to dashboard's handleTesterProgressStub, and number of invocations.
      //   params to dashboard's handleTesterPctCompleteStub, and number of invocations.
      //   params to dashboard's handleTesterBugCountStub, and number of invocations.

      expect(testerEventHandlerSpy.callCount).to.equal(4);
      expect(handleTesterProgressStub.callCount).to.equal(4);

      expect(testerEventHandlerSpy.getCall(0).args).to.equal(['testerProgress', 'app', 'lowPrivUser', '"app" tester for session with Id "lowPrivUser" doesn\'t currently appear to be online']);
      expect(handleTesterProgressStub.getCall(0).args).to.equal(['app', 'lowPrivUser', '"app" tester for session with Id "lowPrivUser" doesn\'t currently appear to be online']);

      expect(testerEventHandlerSpy.getCall(1).args).to.equal(['testerProgress', 'app', 'adminUser', '"app" tester for session with Id "adminUser" doesn\'t currently appear to be online']);
      expect(handleTesterProgressStub.getCall(1).args).to.equal(['app', 'adminUser', '"app" tester for session with Id "adminUser" doesn\'t currently appear to be online']);

      expect(testerEventHandlerSpy.getCall(2).args).to.equal(['testerProgress', 'server', 'NA', 'No server testing available currently. The server tester is currently in-active.']);
      expect(handleTesterProgressStub.getCall(2).args).to.equal(['server', 'NA', 'No server testing available currently. The server tester is currently in-active.']);

      expect(testerEventHandlerSpy.getCall(3).args).to.equal(['testerProgress', 'tls', 'NA', 'No tls testing available currently. The tls tester is currently in-active.']);
      expect(handleTesterProgressStub.getCall(3).args).to.equal(['tls', 'NA', 'No tls testing available currently. The tls tester is currently in-active.']);
    });
  });


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
