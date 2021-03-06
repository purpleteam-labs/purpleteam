// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of purpleteam.

// purpleteam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// purpleteam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with purpleteam. If not, see <https://www.gnu.org/licenses/>.

const EventEmitter = require('events');
const Bourne = require('@hapi/bourne');

let job;
const events = { testerProgress: [], testerPctComplete: [], testerBugCount: [] };


class Model extends EventEmitter {
  constructor(options) {
    super();
    job = Bourne.parse(options);
    this.eventNames.forEach((e) => this.initTesterMessages(e));
  }

  // eslint-disable-next-line class-methods-use-this
  get eventNames() {
    return Object.keys(events);
  }

  // eslint-disable-next-line class-methods-use-this
  initTesterMessages(eventName) {
    events[eventName] = job.included.filter((resourceObj) => resourceObj.type === 'testSession')
      .map((testSessionResObj) => ({ testerType: 'app', sessionId: testSessionResObj.id, messages: [] }));
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
    const testerSessions = job.included.filter((resourceObj) => resourceObj.type === 'testSession').map((testSessionResObj) => {
      let alertThreshold;
      if (testSessionResObj.attributes) {
        alertThreshold = testSessionResObj.attributes.alertThreshold ? testSessionResObj.attributes.alertThreshold : 0;
      } else {
        alertThreshold = 0;
      }
      return { testerType: 'app', sessionId: testSessionResObj.id, threshold: alertThreshold };
    });
    testerSessions.push({ testerType: 'server', sessionId: 'NA', threshold: 0 });
    testerSessions.push({ testerType: 'tls', sessionId: 'NA', threshold: 0 });
    return testerSessions;
  }
}


module.exports = Model;
