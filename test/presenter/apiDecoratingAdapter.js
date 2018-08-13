/* eslint-disable no-underscore-dangle */
/* eslint-disable */
const cwd = process.cwd();
// require('app-module-path').addPath(cwd);
exports.lab = require('lab').script();

const { describe, it, before, beforeEach /* , afterEach */ } = exports.lab; // eslint-disable-line

const { expect } = require('code'); // eslint-disable-line
const sinon = require('sinon'); // eslint-disable-line
const rewire = require('rewire'); // eslint-disable-line

const config = require('config/config');
debugger;
const log = require('purpleteam-logger').init(config.get('logger')); // eslint-disable-line
debugger;  // eslint-disable-line

const buildUserConfigFilePath = config.get('buildUserConfig.fileUri');




const readFileAsync = require('util').promisify(require('fs').readFile);
const content = (async () => {
  return await readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' });
})();


describe('apiDecoratingAdapter', async () => {
  describe('getTestPlans', async () => {
    it('- should provide the dashboard with the test plan to display', async () => { // eslint-disable-line
      debugger;

      const api = rewire('src/presenter/apiDecoratingAdapter')
      const configFileContents = await content;
      api.init(log);

      //const configFileContents = await api.getBuildUserConfigFile(buildUserConfigFilePath);

      //const configFileContentsss = await readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' })
      debugger;
      
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
});
