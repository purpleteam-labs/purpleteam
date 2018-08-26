require('app-module-path').addPath(process.cwd());
exports.lab = require('lab').script();

const { describe, /* it, */ before, beforeEach, afterEach } = exports.lab;


const sinon = require('sinon');
const rewire = require('rewire');
const readFileAsync = require('util').promisify(require('fs').readFile);
const config = require('config/config');
const log = require('purpleteam-logger').init(config.get('logger'));

// const apiUrl = config.get('purpleteamApi.url');
// const eventSourceOrigin = `${config.get('purpleteamApi.protocol')}://${config.get('purpleteamApi.ip')}:${config.get('purpleteamApi.port')}`;
const buildUserConfigFilePath = config.get('buildUserConfig.fileUri');
// const dashboard = require('src/view/dashboard');
// const api = require('src/presenter/apiDecoratingAdapter');
// const { MockEvent, EventSource } = require('./mocksse');
// const { TesterProgressRouteSuffix } = require('src/strings');
// const Model = require('src/models/model');


describe('apiDecoratingAdapter', () => {
  before(async (flags) => {
    flags.context.buildUserConfigFileContent = await (async () => readFileAsync(buildUserConfigFilePath, { encoding: 'utf8' }))();
  });
  describe('getTestPlans', () => {

  });


  describe('postToApi', () => {
    beforeEach(async (flags) => {
      const { context } = flags;
      context.rewiredApi = rewire('src/presenter/apiDecoratingAdapter');

      context.rewiredRequest = context.rewiredApi.__get__('request');
      context.requestStub = sinon.stub(context.rewiredRequest, 'post');

      context.revertRewiredApiRequest = context.rewiredApi.__set__('request', context.requestStub);

      context.log = log;
      context.critStub = sinon.stub(context.log, 'crit');
      context.log.crit = context.critStub;
      context.rewiredApi.init(context.log);
    });


    // it('- on - socket hang up - should throw error - backendTookToLong', () => {
    //   // Todo: KC: Need to reproduce error state.
    // });

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
  });
});
