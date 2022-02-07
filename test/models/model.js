// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import { readFile } from 'fs/promises';
import test from 'ava';

import config from '../../config/config.js';
import Model from '../../src/models/model.js';

const jobFilePath = config.get('job.fileUri');
const jobFileContents = await readFile(jobFilePath, { encoding: 'utf8' });

test.beforeEach((t) => {
  t.context.model = new Model(jobFileContents); // eslint-disable-line no-param-reassign
});

test('eventNames - should return valid event names', (t) => {
  const { model } = t.context;
  const { eventNames } = model;

  t.deepEqual(eventNames, ['testerProgress', 'testerPctComplete', 'testerBugCount']);
});

test('testerSessions - should return valid testerSessions', (t) => {
  const { model } = t.context;
  // expectedTesterSessions also used in the presenter tests
  const expectedTesterSessions = [
    { testerType: 'app', sessionId: 'lowPrivUser', threshold: 12 },
    { testerType: 'app', sessionId: 'adminUser', threshold: 0 },
    { testerType: 'server', sessionId: 'NA', threshold: 0 },
    { testerType: 'tls', sessionId: 'NA', threshold: 3 }
  ];

  const testerSessions = model.testerSessions();
  t.deepEqual(testerSessions, expectedTesterSessions);
});

test('testerNamesAndSessions - should return valid testerNamesAndSessions', (t) => {
  const { model: { testerNamesAndSessions } } = t.context;

  const expectedTesterNamesAndSessions = [
    { testerType: 'app', sessionId: 'lowPrivUser' },
    { testerType: 'app', sessionId: 'adminUser' },
    { testerType: 'server', sessionId: 'NA' },
    { testerType: 'tls', sessionId: 'NA' }
  ];

  t.deepEqual(testerNamesAndSessions, expectedTesterNamesAndSessions);
});

test('propagateTesterMessage - with testerType app, sessionId lowPrivUser - should fire testerProgress event, if event not specified, once only', (t) => {
  const { model } = t.context;
  let eventHandlerInvocationCount = 0;
  const appTesterLowPrivUserSessionIdMessage = {
    testerType: 'app',
    sessionId: 'lowPrivUser',
    message: 'App tests are now running.'
  };

  model.on('testerProgress', (testerType, sessionId, message) => {
    t.deepEqual(testerType, appTesterLowPrivUserSessionIdMessage.testerType);
    t.deepEqual(sessionId, appTesterLowPrivUserSessionIdMessage.sessionId);
    t.deepEqual(message, appTesterLowPrivUserSessionIdMessage.message);
    eventHandlerInvocationCount += 1;
  });
  model.on('testerPctComplete', () => {
    t.fail('testerPctComplete handler should not be invoked');
  });
  model.on('testerBugCount', () => {
    t.fail('testerBugCount handler should not be invoked');
  });

  model.propagateTesterMessage(appTesterLowPrivUserSessionIdMessage);

  t.is(eventHandlerInvocationCount, 1);
});

test('propagateTesterMessage - with testerType app, sessionId lowPrivUser - should fire testerProgress event, if event specified, once only', (t) => {
  const { model } = t.context;
  let eventHandlerInvocationCount = 0;
  const appTesterLowPrivUserSessionIdMessage = {
    testerType: 'app',
    sessionId: 'lowPrivUser',
    message: 'App tests are now running.',
    event: 'testerProgress'
  };

  model.on('testerProgress', (testerType, sessionId, message) => {
    t.deepEqual(testerType, appTesterLowPrivUserSessionIdMessage.testerType);
    t.deepEqual(sessionId, appTesterLowPrivUserSessionIdMessage.sessionId);
    t.deepEqual(message, appTesterLowPrivUserSessionIdMessage.message);
    eventHandlerInvocationCount += 1;
  });
  model.on('testerPctComplete', () => {
    t.fail('testerPctComplete handler should not be invoked');
  });
  model.on('testerBugCount', () => {
    t.fail('testerBugCount handler should not be invoked');
  });

  model.propagateTesterMessage(appTesterLowPrivUserSessionIdMessage);

  t.is(eventHandlerInvocationCount, 1);
});

test('propagateTesterMessage - with testerType app, sessionId lowPrivUser - should fire testerPctComplete event, once only', (t) => {
  const { model } = t.context;
  let eventHandlerInvocationCount = 0;
  const appTesterLowPrivUserSessionIdMessage = {
    testerType: 'app',
    sessionId: 'lowPrivUser',
    message: 20,
    event: 'testerPctComplete'
  };

  model.on('testerProgress', () => {
    t.fail('testerProgress handler should not be invoked');
  });
  model.on('testerPctComplete', (testerType, sessionId, message) => {
    t.deepEqual(testerType, appTesterLowPrivUserSessionIdMessage.testerType);
    t.deepEqual(sessionId, appTesterLowPrivUserSessionIdMessage.sessionId);
    t.deepEqual(message, appTesterLowPrivUserSessionIdMessage.message);
    eventHandlerInvocationCount += 1;
  });
  model.on('testerBugCount', () => {
    t.fail('testerBugCount handler should not be invoked');
  });

  model.propagateTesterMessage(appTesterLowPrivUserSessionIdMessage);

  t.is(eventHandlerInvocationCount, 1);
});

test('propagateTesterMessage - with testerType app, sessionId lowPrivUser - should fire testerBugCount event, once only', (t) => {
  const { model } = t.context;
  let eventHandlerInvocationCount = 0;
  const appTesterLowPrivUserSessionIdMessage = {
    testerType: 'app',
    sessionId: 'lowPrivUser',
    message: 4,
    event: 'testerBugCount'
  };

  model.on('testerProgress', () => {
    t.fail('testerProgress handler should not be invoked');
  });
  model.on('testerPctComplete', () => {
    t.fail('testerPctComplete handler should not be invoked');
  });
  model.on('testerBugCount', (testerType, sessionId, message) => {
    t.deepEqual(testerType, appTesterLowPrivUserSessionIdMessage.testerType);
    t.deepEqual(sessionId, appTesterLowPrivUserSessionIdMessage.sessionId);
    t.deepEqual(message, appTesterLowPrivUserSessionIdMessage.message);
    eventHandlerInvocationCount += 1;
  });

  model.propagateTesterMessage(appTesterLowPrivUserSessionIdMessage);

  t.is(eventHandlerInvocationCount, 1);
});

test('propagateTesterMessage - with testerType app, sessionId lowPrivUser - with unknown event - should not fire any event', (t) => {
  const { model } = t.context;
  const expectedError = `Invalid event of type "unknownEvent" was received. The known events are [${model.eventNames}]`;
  const appTesterLowPrivUserSessionIdMessage = {
    testerType: 'app',
    sessionId: 'lowPrivUser',
    message: 4,
    event: 'unknownEvent'
  };

  model.on('testerProgress', () => { t.fail('testerProgress handler should not be invoked'); });
  model.on('testerPctComplete', () => { t.fail('testerPctComplete handler should not be invoked'); });
  model.on('testerBugCount', () => { t.fail('testerBugCount handler should not be invoked'); });

  t.throws(() => {
    model.propagateTesterMessage(appTesterLowPrivUserSessionIdMessage);
  }, { instanceOf: Error, message: expectedError });
});
