// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of PurpleTeam.

// PurpleTeam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// PurpleTeam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this PurpleTeam project. If not, see <https://www.gnu.org/licenses/>.

exports.lab = require('@hapi/lab').script();

const { describe, beforeEach, it } = exports.lab;

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const rewire = require('rewire');
const ptLogger = require('purpleteam-logger');

const cUiPath = '../../src/view/cUi';

// const cUi = require('src/view/cUi');

describe('cUi', () => {
  describe('handleTesterProgress', () => {
    beforeEach((flags) => {
      const { context } = flags;
      context.log0 = sinon.stub();
      context.log1 = sinon.stub();
    });


    it('- testerType `app`, sessionId `lowPrivUser` should log provided message', (flags) => {
      const { context: { log0, log1 } } = flags;
      const rewiredCui = rewire(cUiPath);

      const logger0 = { sessionId: 'lowPrivUser', instance: { log: log0 } };
      const logger1 = { sessionId: 'adminUser', instance: { log: log1 } };
      const testerType = 'app';
      const sessionId = 'lowPrivUser';
      const message = 'App tests are now running.';

      const revertRewiredCuiInternalsInfoOutsAppLoggers = rewiredCui.__set__(`internals.infoOuts.${testerType}.loggers`, [logger0, logger1]);

      const ptLoggerAppLowPrivUser = { notice: () => {} };
      const ptLoggerAppLowPrivUserNoticeSpy = sinon.spy(ptLoggerAppLowPrivUser, 'notice');
      const ptLoggerGetAppLowPrivUserStub = sinon.stub(ptLogger, 'get').returns(ptLoggerAppLowPrivUser);

      rewiredCui.handleTesterProgress({ testerType, sessionId: 'lowPrivUser', message: 'App tests are now running.', ptLogger });

      flags.onCleanup = () => {
        revertRewiredCuiInternalsInfoOutsAppLoggers();
        ptLoggerAppLowPrivUser.notice.restore();
        ptLogger.get.restore();
      };

      expect(log0.callCount).to.equal(1);
      expect(log1.callCount).to.equal(0);
      expect(log0.getCall(0).args).to.equal(['App tests are now running.']);
      expect(ptLoggerGetAppLowPrivUserStub.calledOnceWith(`${testerType}-${sessionId}`)).to.be.true();
      expect(ptLoggerAppLowPrivUserNoticeSpy.calledOnceWith(message)).to.be.true();
    });


    it('- testerType `app`, sessionId `adminUser` should log provided message', (flags) => {
      const { context: { log0, log1 } } = flags;
      const rewiredCui = rewire(cUiPath);

      const logger0 = { sessionId: 'lowPrivUser', instance: { log: log0 } };
      const logger1 = { sessionId: 'adminUser', instance: { log: log1 } };
      const testerType = 'app';
      const sessionId = 'adminUser';
      const message = 'App tests are now running.';

      const revertRewiredCuiInternalsInfoOutsAppLoggers = rewiredCui.__set__(`internals.infoOuts.${testerType}.loggers`, [logger0, logger1]);

      const ptLoggerAppAdminUser = { notice: () => {} };
      const ptLoggerAppAdminUserNoticeSpy = sinon.spy(ptLoggerAppAdminUser, 'notice');
      const ptLoggerGetAppAdminUserStub = sinon.stub(ptLogger, 'get').returns(ptLoggerAppAdminUser);

      rewiredCui.handleTesterProgress({ testerType, sessionId: 'adminUser', message: 'App tests are now running.', ptLogger });

      flags.onCleanup = () => {
        revertRewiredCuiInternalsInfoOutsAppLoggers();
        ptLoggerAppAdminUser.notice.restore();
        ptLogger.get.restore();
      };

      expect(log0.callCount).to.equal(0);
      expect(log1.callCount).to.equal(1);
      expect(log1.getCall(0).args).to.equal(['App tests are now running.']);
      expect(ptLoggerGetAppAdminUserStub.calledOnceWith(`${testerType}-${sessionId}`)).to.be.true();
      expect(ptLoggerAppAdminUserNoticeSpy.calledOnceWith(message)).to.be.true();
    });
  });


  describe('handleTesterPctComplete', () => {
    it('- should handle testerPctComplete event as expected', (flags) => {
      const rewiredCui = rewire(cUiPath);
      const testerType = 'app';
      const sessionId = 'lowPrivUser';
      const message = 17;

      const appStatTableRecords = [{ sessionId: 'lowPrivUser', threshold: 12, bugs: 0, pctComplete: 0 }, { sessionId: 'adminUser', threshold: 0, bugs: 0, pctComplete: 0 }];
      const serverStatTableRecords = [{ sessionId: 'NA', threshold: 0, bugs: 0, pctComplete: 0 }];
      const tlsStatTableRecords = [{ sessionId: 'NA', threshold: 0, bugs: 0, pctComplete: 0 }];
      const revertRewiredCuiInternalsInfoOutsAppStatTableRecords = rewiredCui.__set__(`internals.infoOuts.${testerType}.statTable.records`, appStatTableRecords);
      const revertRewiredCuiInternalsInfoOutsServerStatTableRecords = rewiredCui.__set__(`internals.infoOuts.${'server'}.statTable.records`, serverStatTableRecords);
      const revertRewiredCuiInternalsInfoOutsTlsStatTableRecords = rewiredCui.__set__(`internals.infoOuts.${'tls'}.statTable.records`, tlsStatTableRecords);

      const setDataOnAllPageWidgetsStub = sinon.stub();
      const revertRewiredCuiSetDataOnAllPageWidgets = rewiredCui.__set__('setDataOnAllPageWidgets', setDataOnAllPageWidgetsStub);

      rewiredCui.handleTesterPctComplete({ testerType, sessionId, message });

      const rewiredInfoOuts = rewiredCui.__get__('internals.infoOuts');

      expect(rewiredInfoOuts[testerType].statTable.records[0].pctComplete).to.equal(17);
      expect(rewiredInfoOuts[testerType].testerPctComplete.percent).to.equal(8.5);
      expect(rewiredInfoOuts[testerType].testerPctComplete.color).to.equal('red');

      expect(rewiredInfoOuts.app.totalProgress.percent).to.equal(4.25);
      expect(rewiredInfoOuts.server.totalProgress.percent).to.equal(4.25);
      expect(rewiredInfoOuts.tls.totalProgress.percent).to.equal(4.25);

      expect(setDataOnAllPageWidgetsStub.callCount).to.equal(1);

      flags.onCleanup = () => {
        revertRewiredCuiInternalsInfoOutsAppStatTableRecords();
        revertRewiredCuiInternalsInfoOutsServerStatTableRecords();
        revertRewiredCuiInternalsInfoOutsTlsStatTableRecords();
        revertRewiredCuiSetDataOnAllPageWidgets();
      };
    });
  });


  describe('handleTesterBugCount', () => {
    it('- should handle testerBugCount event as expected', (flags) => {
      const rewiredCui = rewire(cUiPath);
      const testerType = 'app';
      const sessionId = 'lowPrivUser';
      const message = 14;

      const appStatTableRecords = [{ sessionId: 'lowPrivUser', threshold: 12, bugs: 0, pctComplete: 0 }, { sessionId: 'adminUser', threshold: 0, bugs: 0, pctComplete: 0 }];
      const serverStatTableRecords = [{ sessionId: 'NA', threshold: 0, bugs: 0, pctComplete: 0 }];
      const tlsStatTableRecords = [{ sessionId: 'NA', threshold: 0, bugs: 0, pctComplete: 0 }];
      const revertRewiredCuiInternalsInfoOutsAppStatTableRecords = rewiredCui.__set__(`internals.infoOuts.${testerType}.statTable.records`, appStatTableRecords);
      const revertRewiredCuiInternalsInfoOutsServerStatTableRecords = rewiredCui.__set__(`internals.infoOuts.${'server'}.statTable.records`, serverStatTableRecords);
      const revertRewiredCuiInternalsInfoOutsTlsStatTableRecords = rewiredCui.__set__(`internals.infoOuts.${'tls'}.statTable.records`, tlsStatTableRecords);

      const setDataOnAllPageWidgetsStub = sinon.stub();
      const revertRewiredCuiSetDataOnAllPageWidgets = rewiredCui.__set__('setDataOnAllPageWidgets', setDataOnAllPageWidgetsStub);

      rewiredCui.handleTesterBugCount({ testerType, sessionId, message });

      const rewiredInfoOuts = rewiredCui.__get__('internals.infoOuts');

      expect(rewiredInfoOuts[testerType].statTable.records[0].bugs).to.equal(14);
      expect(rewiredInfoOuts.app.newBugs.color).to.equal('red');
      expect(rewiredInfoOuts.app.newBugs.value).to.equal(2);
      expect(rewiredInfoOuts.server.newBugs.color).to.equal('red');
      expect(rewiredInfoOuts.server.newBugs.value).to.equal(2);
      expect(rewiredInfoOuts.tls.newBugs.color).to.equal('red');
      expect(rewiredInfoOuts.tls.newBugs.value).to.equal(2);
      expect(setDataOnAllPageWidgetsStub.callCount).to.equal(1);

      flags.onCleanup = () => {
        revertRewiredCuiInternalsInfoOutsAppStatTableRecords();
        revertRewiredCuiInternalsInfoOutsServerStatTableRecords();
        revertRewiredCuiInternalsInfoOutsTlsStatTableRecords();
        revertRewiredCuiSetDataOnAllPageWidgets();
      };
    });
  });
});
