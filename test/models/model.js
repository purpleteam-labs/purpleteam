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


const newModel = async () => {
  const configFileContents = await readFileAsync(`${cwd}/test/jobs/job_0.1.0-alpha.1`, { encoding: 'utf8' });
  const model = new Model(configFileContents);
  return model;
};


describe('model', async () => {
  // const Model = rewire('src/models/model');

  // The only way to verify initTesterMessages is by the result of propagateTesterMessage


  describe('testerSessions', async () => {
    it('- should return valid testerSessions', async () => {
      const model = await newModel();
      const expectedTesterSessions = [
        { testerType: 'app', sessionId: 'lowPrivUser', threshold: 12 },
        { testerType: 'app', sessionId: 'adminUser', threshold: 0 },
        { testerType: 'server', sessionId: 'NA', threshold: 0 },
        { testerType: 'tls', sessionId: 'NA', threshold: 0 }
      ];

      const testerSessions = model.testerSessions();

      expect(testerSessions).to.equal(expectedTesterSessions);
    });
  });


  describe('testerNamesAndSessions', async () => {
    it('- should return valid testerNamesAndSessions', async () => {
      const model = await newModel();
      const expectedTesterNamesAndSessions = [
        { testerType: 'app', sessionId: 'lowPrivUser' },
        { testerType: 'app', sessionId: 'adminUser' },
        { testerType: 'server', sessionId: 'NA' },
        { testerType: 'tls', sessionId: 'NA' }
      ];

      const testerNamesAndSessions = model.testerNamesAndSessions; // eslint-disable-line

      expect(testerNamesAndSessions).to.equal(expectedTesterNamesAndSessions);
    });
  });


  describe('propagateTesterMessage', () => {
    it('- ', () => {

    });
  });
});
