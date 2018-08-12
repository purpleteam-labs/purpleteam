const cwd = process.cwd();
require('app-module-path').addPath(cwd);
exports.lab = require('lab').script();

const { describe, it } = exports.lab;

const { expect } = require('code');
// const sinon = require('sinon');
// const rewire = require('rewire');

// const config = require('config/config');

const Model = require('src/models/model');


const readFileAsync = require('util').promisify(require('fs').readFile);


describe('model', async () => {
  // const Model = rewire('src/models/model');

  // The only way to verify initTesterMessages is by the result of propagateTesterMessage

  describe('testerSessions', async () => {
    it('- should return valid testerSessions', async () => {
      const configFileContents = await readFileAsync(`${cwd}/test/jobs/job_0.1.0-alpha.1`, { encoding: 'utf8' });
      const model = new Model(configFileContents);
      const testerSessions = model.testerSessions();
      const expectedTesterSessions = [
        {
          testerType: 'app',
          sessionId: 'lowPrivUser',
          threshold: 12
        },
        {
          testerType: 'app',
          sessionId: 'adminUser',
          threshold: 0
        },
        {
          testerType: 'server',
          sessionId: 'NA',
          threshold: 0
        },
        {
          testerType: 'tls',
          sessionId: 'NA',
          threshold: 0
        }
      ];

      expect(testerSessions).to.equal(expectedTesterSessions);
    });
  });
});
