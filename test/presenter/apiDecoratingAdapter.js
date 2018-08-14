/* eslint-disable */
exports.lab = require('lab').script();

const { describe, it, test, before, beforeEach /* , afterEach */ } = exports.lab; // eslint-disable-line

const { expect } = require('code');
const sinon = require('sinon');
const rewire = require('rewire');
const config = require('config/config');
const log = require('purpleteam-logger').init(config.get('logger'));

const buildUserConfigFilePath = config.get('buildUserConfig.fileUri');

const readFileAsync = require('util').promisify(require('fs').readFile);

const buildUserConfigFileContent = (async () => readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' }))();


describe('apiDecoratingAdapter', async () => {
  describe('getTestPlans', async () => {
    it('- should provide the dashboard with the test plan to display', async () => { // eslint-disable-line


      const api = rewire('src/presenter/apiDecoratingAdapter');
      const configFileContents = await buildUserConfigFileContent;
      api.init(log);

      // const configFileContents = await api.getBuildUserConfigFile(buildUserConfigFilePath);

      // const configFileContentsss = await readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' })


      const dashboard = require('src/view/dashboard'); // eslint-disable-line no-param-reassign, global-require


      // debugger; // eslint-disable-line

      const rewiredRequest = api.__get__('request');
      const requestStub = sinon.stub(rewiredRequest, 'post');
      requestStub.returns(Promise.resolve('too many cats'));
      api.__set__('request', requestStub);


      const testPlanStub = sinon.stub(dashboard, 'testPlan');
      dashboard.testPlan = testPlanStub;
      api.__set__('dashboard', dashboard);


      await api.getTestPlans(configFileContents);

      expect(testPlanStub.calledWith('too many cats')).to.be.true();
    });


    // afterEach(({ context }) => {
    //   const { dashboard } = context;
    //   dashboard.testPlan.restore();
    // });
  });


  // describe('test', async () => {
  //   it('- should', async () => {
  //     expect(true).to.equal(true);
  //   });
  // });
  it('should return the build user config file contents', () => {
    const cwd = process.cwd();
    //require('app-module-path').addPath(cwd);
    let api = require(`${cwd}/src/presenter/apiDecoratingAdapter`);
    expect(1 + 1).to.equal(2);
  });
  describe('getBuildUserConfigFile', () => {
    
    //test('should return the build user config file contents', () => {
      //const apii = require('src/presenter/apiDecoratingAdapter');
      //api.init(log);
      //const buildUserConfigFileContents = api.getBuildUserConfigFile(buildUserConfigFilePath);
      //expect(buildUserConfigFileContents).to.match(buildUserConfigFileContent);
      //console.log('testing');
      //expect(1 + 1).to.equal(2);
    //});
  });
});
