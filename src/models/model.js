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

const EventEmitter = require('events');
const Bourne = require('@hapi/bourne');
const config = require('../../config/config');

const sutConfig = config.getSchema()._cvtProperties.sut; // eslint-disable-line no-underscore-dangle
const jobSchemaOpts = {
  loggerConfig: config.get('loggers.cUi'),
  sutConfig: {
    browserOptions: sutConfig._cvtProperties.browser.format, // eslint-disable-line no-underscore-dangle
    defaultBrowser: sutConfig._cvtProperties.browser.default // eslint-disable-line no-underscore-dangle
  },
  jobConfig: config.get('job')
};
const { validateJob } = require('../schemas/job').init(jobSchemaOpts);

let job;
const events = { testerProgress: [], testerPctComplete: [], testerBugCount: [] };


class Model extends EventEmitter {
  constructor(jobFileContents) {
    super();
    const validatedJobFileContent = validateJob(jobFileContents);
    job = Bourne.parse(validatedJobFileContent);
    this.eventNames.forEach((e) => this.initTesterMessages(e));
  }

  // eslint-disable-next-line class-methods-use-this
  get eventNames() {
    return Object.keys(events);
  }

  // eslint-disable-next-line class-methods-use-this
  initTesterMessages(eventName) {
    const appScannerResourceObjectsFromJob = job.included.filter((resourceObj) => resourceObj.type === 'appScanner');
    const appScannerResourceObjects = appScannerResourceObjectsFromJob.length ? appScannerResourceObjectsFromJob : [{ id: 'NA' }]; // If Build User supplied no appScanner resource object.
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

    const appScannerResourceObjects = job.included.filter((resourceObj) => resourceObj.type === 'appScanner');
    const serverScannerResourceObjects = job.included.filter((resourceObj) => resourceObj.type === 'serverScanner');
    const tlsScannerResourceObjects = job.included.filter((resourceObj) => resourceObj.type === 'tlsScanner');

    testerSessions.push(...(appScannerResourceObjects.length ? appScannerResourceObjects.map((tSRO) => (
      { testerType: 'app', sessionId: tSRO.id, threshold: tSRO.attributes.alertThreshold || 0 }
    )) : [{ testerType: 'app', sessionId: 'NA', threshold: 0 }]));
    testerSessions.push(...(serverScannerResourceObjects.length ? serverScannerResourceObjects.map((sSRO) => (
      { testerType: 'server', sessionId: sSRO.id, threshold: sSRO.attributes.alertThreshold || 0 }
    )) : [{ testerType: 'server', sessionId: 'NA', threshold: 0 }]));
    testerSessions.push(...(tlsScannerResourceObjects.length ? tlsScannerResourceObjects.map((tSRO) => (
      { testerType: 'tls', sessionId: tSRO.id, threshold: tSRO.attributes.alertThreshold || 0 }
    )) : [{ testerType: 'tls', sessionId: 'NA', threshold: 0 }]));

    return testerSessions;
  }
}


module.exports = Model;
