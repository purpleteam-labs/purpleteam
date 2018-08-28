exports.lab = require('lab').script();

const { describe, beforeEach, it } = exports.lab;

const { expect } = require('code');
const sinon = require('sinon');
const rewire = require('rewire');

// const dashboard = require('src/view/dashboard');

describe('dashboard', () => {
  describe('handleTesterProgress', () => {
    beforeEach((flags) => {
      const { context } = flags;
      context.log0 = sinon.stub();
      context.log1 = sinon.stub();
    });


    it('- testerType `app`, sessionId `lowPrivUser` should log provided message', (flags) => {
      const { context: { log0, log1 } } = flags;
      const rewiredDashboard = rewire('src/view/dashboard');

      const logger0 = { sessionId: 'lowPrivUser', instance: { log: log0 } };
      const logger1 = { sessionId: 'adminUser', instance: { log: log1 } };
      const testerType = 'app';
      const revertRewiredDashboardInternalsInfoOutsAppLoggers = rewiredDashboard.__set__(`internals.infoOuts.${testerType}.loggers`, [logger0, logger1]);

      rewiredDashboard.handleTesterProgress(testerType, 'lowPrivUser', 'App tests are now running.');

      flags.onCleanup = () => { revertRewiredDashboardInternalsInfoOutsAppLoggers(); };

      expect(log0.callCount).to.equal(1);
      expect(log1.callCount).to.equal(0);
      expect(log0.getCall(0).args).to.equal(['App tests are now running.']);
    });


    it('- testerType `app`, sessionId `adminUser` should log provided message', (flags) => {
      const { context: { log0, log1 } } = flags;
      const rewiredDashboard = rewire('src/view/dashboard');

      const logger0 = { sessionId: 'lowPrivUser', instance: { log: log0 } };
      const logger1 = { sessionId: 'adminUser', instance: { log: log1 } };
      const testerType = 'app';

      const revertRewiredDashboardInternalsInfoOutsAppLoggers = rewiredDashboard.__set__(`internals.infoOuts.${testerType}.loggers`, [logger0, logger1]);

      rewiredDashboard.handleTesterProgress(testerType, 'adminUser', 'App tests are now running.');

      flags.onCleanup = () => { revertRewiredDashboardInternalsInfoOutsAppLoggers(); };

      expect(log0.callCount).to.equal(0);
      expect(log1.callCount).to.equal(1);
      expect(log1.getCall(0).args).to.equal(['App tests are now running.']);
    });
  });


  describe('handleTesterPctComplete', () => {


  });


  describe('handleTesterBugCount', () => {


  });
});
