exports.lab = require('lab').script();

const { describe, it, test, before, beforeEach /* , afterEach */ } = exports.lab; // eslint-disable-line

const { expect } = require('code');
const sinon = require('sinon');
const rewire = require('rewire');
const readFileAsync = require('util').promisify(require('fs').readFile);
const config = require('config/config');
const log = require('purpleteam-logger').init(config.get('logger'));

const buildUserConfigFilePath = config.get('buildUserConfig.fileUri');
const dashboard = require('src/view/dashboard');

describe('apiDecoratingAdapter', async () => {
  describe('getTestPlans', async () => {
    before(async ({ context }) => {
      context.buildUserConfigFileContent = await (async () => readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' }))(); // eslint-disable-line no-param-reassign
    });
    it('- should provide the dashboard with the test plan to display', async ({ context }) => {
      const { buildUserConfigFileContent } = context;
      const api = rewire('src/presenter/apiDecoratingAdapter');
      const configFileContents = await buildUserConfigFileContent;
      api.init(log);
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

      const rewiredRequest = api.__get__('request');
      const requestStub = sinon.stub(rewiredRequest, 'post');
      requestStub.returns(Promise.resolve(apiResponse));
      api.__set__('request', requestStub);

      const testPlanStub = sinon.stub(dashboard, 'testPlan');
      dashboard.testPlan = testPlanStub;
      api.__set__('dashboard', dashboard);

      await api.getTestPlans(configFileContents);

      expect(testPlanStub.getCall(0).args[0]).to.equal(expectedArgPasssedToTestPlan);
    });
  });


  //  describe('test', async () => {
  //    it('- should', async () => {
  //      expect(true).to.equal(true);
  //    });
  //  });
  // it('should return the build user config file contents', () => {
  //   const cwd = process.cwd();
  //   //require('app-module-path').addPath(cwd);
  //   let apii = require(`${cwd}/src/presenter/apiDecoratingAdapter`);
  //   expect(1 + 1).to.equal(2);
  // });
  describe('getBuildUserConfigFile', async () => {
    before(async ({ context }) => {
      context.buildUserConfigFileContent = await (async () => readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' }))(); // eslint-disable-line no-param-reassign
      context.api = require('src/presenter/apiDecoratingAdapter'); // eslint-disable-line no-param-reassign, global-require
    });
    it('- should return the build user config file contents', async ({ context }) => {
      const { buildUserConfigFileContent, api } = context;
      api.init(log);
      const buildUserConfigFileContents = await api.getBuildUserConfigFile(buildUserConfigFilePath);
      expect(buildUserConfigFileContents).to.equal(buildUserConfigFileContent);
    });
  });
});
