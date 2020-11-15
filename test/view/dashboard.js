exports.lab = require('@hapi/lab').script();

const { describe, beforeEach, it } = exports.lab;

const { expect } = require('@hapi/code');
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
    it('- should handle testerPctComplete event as expected', (flags) => {
      const rewiredDashboard = rewire('src/view/dashboard');
      const testerType = 'app';
      const sessionId = 'lowPrivUser';
      const message = 17;

      const appStatTableRecords = [{ sessionId: 'lowPrivUser', threshold: 12, bugs: 0, pctComplete: 0 }, { sessionId: 'adminUser', threshold: 0, bugs: 0, pctComplete: 0 }];
      const serverStatTableRecords = [{ sessionId: 'NA', threshold: 0, bugs: 0, pctComplete: 0 }];
      const tlsStatTableRecords = [{ sessionId: 'NA', threshold: 0, bugs: 0, pctComplete: 0 }];
      const revertRewiredDashboardInternalsInfoOutsAppStatTableRecords = rewiredDashboard.__set__(`internals.infoOuts.${testerType}.statTable.records`, appStatTableRecords);
      const revertRewiredDashboardInternalsInfoOutsServerStatTableRecords = rewiredDashboard.__set__(`internals.infoOuts.${'server'}.statTable.records`, serverStatTableRecords);
      const revertRewiredDashboardInternalsInfoOutsTlsStatTableRecords = rewiredDashboard.__set__(`internals.infoOuts.${'tls'}.statTable.records`, tlsStatTableRecords);

      const setDataOnAllPageWidgetsStub = sinon.stub();
      const revertRewiredDashboardSetDataOnAllPageWidgets = rewiredDashboard.__set__('setDataOnAllPageWidgets', setDataOnAllPageWidgetsStub);

      rewiredDashboard.handleTesterPctComplete(testerType, sessionId, message);

      const rewiredInfoOuts = rewiredDashboard.__get__('internals.infoOuts');

      expect(rewiredInfoOuts[testerType].statTable.records[0].pctComplete).to.equal(17);
      expect(rewiredInfoOuts[testerType].testerPctComplete.percent).to.equal(8.5);
      expect(rewiredInfoOuts[testerType].testerPctComplete.color).to.equal('red');

      expect(rewiredInfoOuts.app.totalProgress.percent).to.equal(4.25);
      expect(rewiredInfoOuts.server.totalProgress.percent).to.equal(4.25);
      expect(rewiredInfoOuts.tls.totalProgress.percent).to.equal(4.25);

      expect(setDataOnAllPageWidgetsStub.callCount).to.equal(1);

      flags.onCleanup = () => {
        revertRewiredDashboardInternalsInfoOutsAppStatTableRecords();
        revertRewiredDashboardInternalsInfoOutsServerStatTableRecords();
        revertRewiredDashboardInternalsInfoOutsTlsStatTableRecords();
        revertRewiredDashboardSetDataOnAllPageWidgets();
      };
    });
  });


  describe('handleTesterBugCount', () => {
    it('- should handle testerBugCount event as expected', (flags) => {
      const rewiredDashboard = rewire('src/view/dashboard');
      const testerType = 'app';
      const sessionId = 'lowPrivUser';
      const message = 14;

      const appStatTableRecords = [{ sessionId: 'lowPrivUser', threshold: 12, bugs: 0, pctComplete: 0 }, { sessionId: 'adminUser', threshold: 0, bugs: 0, pctComplete: 0 }];
      const serverStatTableRecords = [{ sessionId: 'NA', threshold: 0, bugs: 0, pctComplete: 0 }];
      const tlsStatTableRecords = [{ sessionId: 'NA', threshold: 0, bugs: 0, pctComplete: 0 }];
      const revertRewiredDashboardInternalsInfoOutsAppStatTableRecords = rewiredDashboard.__set__(`internals.infoOuts.${testerType}.statTable.records`, appStatTableRecords);
      const revertRewiredDashboardInternalsInfoOutsServerStatTableRecords = rewiredDashboard.__set__(`internals.infoOuts.${'server'}.statTable.records`, serverStatTableRecords);
      const revertRewiredDashboardInternalsInfoOutsTlsStatTableRecords = rewiredDashboard.__set__(`internals.infoOuts.${'tls'}.statTable.records`, tlsStatTableRecords);

      const setDataOnAllPageWidgetsStub = sinon.stub();
      const revertRewiredDashboardSetDataOnAllPageWidgets = rewiredDashboard.__set__('setDataOnAllPageWidgets', setDataOnAllPageWidgetsStub);

      rewiredDashboard.handleTesterBugCount(testerType, sessionId, message);

      const rewiredInfoOuts = rewiredDashboard.__get__('internals.infoOuts');

      expect(rewiredInfoOuts[testerType].statTable.records[0].bugs).to.equal(14);
      expect(rewiredInfoOuts.app.newBugs.color).to.equal('red');
      expect(rewiredInfoOuts.app.newBugs.value).to.equal(2);
      expect(rewiredInfoOuts.server.newBugs.color).to.equal('red');
      expect(rewiredInfoOuts.server.newBugs.value).to.equal(2);
      expect(rewiredInfoOuts.tls.newBugs.color).to.equal('red');
      expect(rewiredInfoOuts.tls.newBugs.value).to.equal(2);
      expect(setDataOnAllPageWidgetsStub.callCount).to.equal(1);

      flags.onCleanup = () => {
        revertRewiredDashboardInternalsInfoOutsAppStatTableRecords();
        revertRewiredDashboardInternalsInfoOutsServerStatTableRecords();
        revertRewiredDashboardInternalsInfoOutsTlsStatTableRecords();
        revertRewiredDashboardSetDataOnAllPageWidgets();
      };
    });
  });
});
