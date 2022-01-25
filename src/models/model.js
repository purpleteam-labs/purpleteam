// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import EventEmitter from 'events';
import Bourne from '@hapi/bourne';
import config from '../../config/config.js';
import initJobSchema from '../schemas/job.js';

const sutConfig = config.getSchema()._cvtProperties.sut; // eslint-disable-line no-underscore-dangle
const jobSchemaOpts = {
  loggerConfig: config.get('loggers.cUi'),
  sutConfig: {
    browserOptions: sutConfig._cvtProperties.browser.format, // eslint-disable-line no-underscore-dangle
    defaultBrowser: sutConfig._cvtProperties.browser.default // eslint-disable-line no-underscore-dangle
  },
  jobConfig: config.get('job')
};
const { validateJob } = initJobSchema(jobSchemaOpts);

const events = { testerProgress: [], testerPctComplete: [], testerBugCount: [] };


class Model extends EventEmitter {
  constructor(jobFileContents) {
    super();
    const validatedJobFileContent = validateJob(jobFileContents);
    this.job = Bourne.parse(validatedJobFileContent);
    this.eventNames.forEach((e) => this.initTesterMessages(e));
  }

  // eslint-disable-next-line class-methods-use-this
  get eventNames() {
    return Object.keys(events);
  }

  // eslint-disable-next-line class-methods-use-this
  initTesterMessages(eventName) {
    const appScannerResourceObjectsFromJob = this.job.included.filter((resourceObj) => resourceObj.type === 'appScanner');
    const appScannerResourceObjects = appScannerResourceObjectsFromJob.length >= config.get('testers.server.minNum') && appScannerResourceObjectsFromJob.length <= config.get('testers.app.maxNum')
      ? appScannerResourceObjectsFromJob
      : [{ id: 'NA' }]; // If Build User supplied an incorrect number of appScanner resource objects.
    events[eventName] = appScannerResourceObjects.map((aSRO) => ({ testerType: 'app', sessionId: aSRO.id, messages: [] }));
    events[eventName].push({ testerType: 'server', sessionId: 'NA', messages: [] });
    events[eventName].push({ testerType: 'tls', sessionId: 'NA', messages: [] });
  }

  // eslint-disable-next-line class-methods-use-this
  get testerNamesAndSessions() {
    return events.testerProgress.map((tNAS) => ({ testerType: tNAS.testerType, sessionId: tNAS.sessionId }));
  }


  propagateTesterMessage(msgOpts) {
    const defaultEvent = 'testerProgress';
    const eventType = msgOpts.event || defaultEvent;
    if (this.eventNames.includes(eventType)) {
      const msgEvents = events[eventType].find((record) => record.testerType === msgOpts.testerType && record.sessionId === msgOpts.sessionId);
      msgEvents.messages.push(msgOpts.message);
      // (push/shift) Setup as placeholder for proper queue if needed.
      this.emit(msgOpts.event || defaultEvent, msgEvents.testerType, msgEvents.sessionId, msgEvents.messages.shift());
    } else {
      throw new Error(`Invalid event of type "${eventType}" was received. The known events are [${this.eventNames}]`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  testerSessions() {
    const testerSessions = [];

    const appScannerResourceObjects = this.job.included.filter((resourceObj) => resourceObj.type === 'appScanner');
    const serverScannerResourceObjects = this.job.included.filter((resourceObj) => resourceObj.type === 'serverScanner');
    const tlsScannerResourceObjects = this.job.included.filter((resourceObj) => resourceObj.type === 'tlsScanner');

    testerSessions.push(...(appScannerResourceObjects.length >= config.get('testers.app.minNum') && appScannerResourceObjects.length <= config.get('testers.app.maxNum')
      ? appScannerResourceObjects.map((aSRO) => (
        { testerType: 'app', sessionId: aSRO.id, threshold: aSRO.attributes.alertThreshold || 0 }
      ))
      : [{ testerType: 'app', sessionId: 'NA', threshold: 0 }]
    ));
    testerSessions.push(...(serverScannerResourceObjects.length >= config.get('testers.server.minNum') && serverScannerResourceObjects.length <= config.get('testers.server.maxNum')
      ? serverScannerResourceObjects.map((sSRO) => (
        { testerType: 'server', sessionId: sSRO.id, threshold: sSRO.attributes.alertThreshold || 0 }
      ))
      : [{ testerType: 'server', sessionId: 'NA', threshold: 0 }]
    ));
    testerSessions.push(...(tlsScannerResourceObjects.length >= config.get('testers.tls.minNum') && tlsScannerResourceObjects.length <= config.get('testers.tls.maxNum')
      ? tlsScannerResourceObjects.map((tSRO) => (
        { testerType: 'tls', sessionId: tSRO.id, threshold: tSRO.attributes.alertThreshold || 0 }
      ))
      : [{ testerType: 'tls', sessionId: 'NA', threshold: 0 }]
    ));

    return testerSessions;
  }
}


export default Model;
