// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

exports.lab = require('@hapi/lab').script();

const { describe, it } = exports.lab;

const { expect, fail } = require('@hapi/code');
// const sinon = require('sinon');
// const rewire = require('rewire');

const readFileAsync = require('util').promisify(require('fs').readFile);

const config = require('../../config/config');
const Model = require('../../src/models/model');


const newModel = async () => {
  const jobFileContents = await readFileAsync(config.get('job.fileUri'), { encoding: 'utf8' });
  const model = new Model(jobFileContents);
  return model;
};


describe('model', /* async */ () => {
  // The only way to verify initTesterMessages is by the result of propagateTesterMessage


  it('- eventNames - should return valid event names', async () => {
    const model = await newModel();
    const { eventNames } = model;

    expect(eventNames).to.equal(['testerProgress', 'testerPctComplete', 'testerBugCount']);
  });


  describe('testerSessions', /* async */ () => {
    it('- should return valid testerSessions', async () => {
      const model = await newModel();
      // expectedTesterSessions also used in the presenter tests
      const expectedTesterSessions = [
        { testerType: 'app', sessionId: 'lowPrivUser', threshold: 12 },
        { testerType: 'app', sessionId: 'adminUser', threshold: 0 },
        { testerType: 'server', sessionId: 'NA', threshold: 0 },
        { testerType: 'tls', sessionId: 'NA', threshold: 3 }
      ];

      const testerSessions = model.testerSessions();

      expect(testerSessions).to.once.include(expectedTesterSessions);
    });
  });


  describe('testerNamesAndSessions', /* async */ () => {
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


  describe('propagateTesterMessage', /* async */ () => {
    const invokedOnce = 1;
    it('- with testerType app, sessionId lowPrivUser - should fire testerProgress event, if event not specified, once only', async () => {
      const model = await newModel();
      let eventHandlerInvocationCount = 0;
      const appTesterLowPrivUserSessionIdMessage = {
        testerType: 'app',
        sessionId: 'lowPrivUser',
        message: 'App tests are now running.'
      };

      model.on('testerProgress', (testerType, sessionId, message) => {
        expect(testerType).to.equal(appTesterLowPrivUserSessionIdMessage.testerType);
        expect(sessionId).to.equal(appTesterLowPrivUserSessionIdMessage.sessionId);
        expect(message).to.equal(appTesterLowPrivUserSessionIdMessage.message);
        eventHandlerInvocationCount += 1;
      });
      model.on('testerPctComplete', () => {
        fail('testerPctComplete handler should not be invoked');
      });
      model.on('testerBugCount', () => {
        fail('testerBugCount handler should not be invoked');
      });

      model.propagateTesterMessage(appTesterLowPrivUserSessionIdMessage);

      expect(eventHandlerInvocationCount).to.equal(invokedOnce);
    });


    it('- with testerType app, sessionId lowPrivUser - should fire testerProgress event, if event specified, once only', async () => {
      const model = await newModel();
      let eventHandlerInvocationCount = 0;
      const appTesterLowPrivUserSessionIdMessage = {
        testerType: 'app',
        sessionId: 'lowPrivUser',
        message: 'Initialising subscription to "app-lowPrivUser" channel for the event "testerProgress"',
        event: 'testerProgress'
      };

      model.on('testerProgress', (testerType, sessionId, message) => {
        expect(testerType).to.equal(appTesterLowPrivUserSessionIdMessage.testerType);
        expect(sessionId).to.equal(appTesterLowPrivUserSessionIdMessage.sessionId);
        expect(message).to.equal(appTesterLowPrivUserSessionIdMessage.message);
        eventHandlerInvocationCount += 1;
      });
      model.on('testerPctComplete', () => {
        fail('testerPctComplete handler should not be invoked');
      });
      model.on('testerBugCount', () => {
        fail('testerBugCount handler should not be invoked');
      });

      model.propagateTesterMessage(appTesterLowPrivUserSessionIdMessage);

      expect(eventHandlerInvocationCount).to.equal(invokedOnce);
    });


    it('- with testerType app, sessionId lowPrivUser - should fire testerPctComplete event, once only', async () => {
      const model = await newModel();
      let eventHandlerInvocationCount = 0;
      const appTesterLowPrivUserSessionIdMessage = {
        testerType: 'app',
        sessionId: 'lowPrivUser',
        message: 20,
        event: 'testerPctComplete'
      };

      model.on('testerProgress', () => {
        fail('testerProgress handler should not be invoked');
      });
      model.on('testerPctComplete', (testerType, sessionId, message) => {
        expect(testerType).to.equal(appTesterLowPrivUserSessionIdMessage.testerType);
        expect(sessionId).to.equal(appTesterLowPrivUserSessionIdMessage.sessionId);
        expect(message).to.equal(appTesterLowPrivUserSessionIdMessage.message);
        eventHandlerInvocationCount += 1;
      });
      model.on('testerBugCount', () => {
        fail('testerBugCount handler should not be invoked');
      });

      model.propagateTesterMessage(appTesterLowPrivUserSessionIdMessage);

      expect(eventHandlerInvocationCount).to.equal(invokedOnce);
    });


    it('- with testerType app, sessionId lowPrivUser - should fire testerBugCount event, once only', async () => {
      const model = await newModel();
      let eventHandlerInvocationCount = 0;
      const appTesterLowPrivUserSessionIdMessage = {
        testerType: 'app',
        sessionId: 'lowPrivUser',
        message: 4,
        event: 'testerBugCount'
      };

      model.on('testerProgress', () => {
        fail('testerProgress handler should not be invoked');
      });
      model.on('testerPctComplete', () => {
        fail('testerPctComplete handler should not be invoked');
      });
      model.on('testerBugCount', (testerType, sessionId, message) => {
        expect(testerType).to.equal(appTesterLowPrivUserSessionIdMessage.testerType);
        expect(sessionId).to.equal(appTesterLowPrivUserSessionIdMessage.sessionId);
        expect(message).to.equal(appTesterLowPrivUserSessionIdMessage.message);
        eventHandlerInvocationCount += 1;
      });

      model.propagateTesterMessage(appTesterLowPrivUserSessionIdMessage);

      expect(eventHandlerInvocationCount).to.equal(invokedOnce);
    });


    it('- with testerType app, sessionId lowPrivUser - with unknown event - should not fire any event', async () => {
      const model = await newModel();
      let errorCount = 0;
      const expectedErrorCount = 1;
      const expectedError = `Invalid event of type "unknownEvent" was received. The known events are [${model.eventNames}]`;
      const appTesterLowPrivUserSessionIdMessage = {
        testerType: 'app',
        sessionId: 'lowPrivUser',
        message: 4,
        event: 'unknownEvent'
      };

      model.on('testerProgress', () => { fail('testerProgress handler should not be invoked'); });
      model.on('testerPctComplete', () => { fail('testerPctComplete handler should not be invoked'); });
      model.on('testerBugCount', () => { fail('testerBugCount handler should not be invoked'); });

      try {
        model.propagateTesterMessage(appTesterLowPrivUserSessionIdMessage);
      } catch (e) {
        expect(e).to.be.an.error(Error, expectedError);
        errorCount += 1;
      }
      expect(errorCount).to.equal(expectedErrorCount);
    });
  });
});
