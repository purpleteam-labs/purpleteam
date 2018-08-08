const EventEmitter = require('events');
let job;
const events = { testerProgress: [], testerPctComplete: [], testerBugCount: [] };



/*
const setAppPctsComplete = (pctsComplete) => {
  // [{ id: 'lowPrivUser', pct: appPct }, { id: 'adminUser', pct: appPct }]
  job.included.forEach((resourceObj) => {
    pctsComplete.forEach((pctObj) => {
      if (resourceObj.type === 'testSession' && resourceObj.id === pctObj.id)
        resourceObj.attributes.appPct = pctObj.pct;
    });
  });
};
*/






class Model extends EventEmitter {
  constructor(options) {
    debugger;
    super();
    job = JSON.parse(options);
    this.eventNames().forEach(e => this.initTesterMessages(e));
  }

  // eslint-disable-next-line class-methods-use-this
  eventNames() {
    return Object.keys(events);
  }

  // eslint-disable-next-line class-methods-use-this
  initTesterMessages(eventName) {
    events[eventName] = job.included.filter(resourceObj =>
      resourceObj.type === 'testSession').map(testSessionResObj =>
      ({ testerType: 'app', sessionId: testSessionResObj.id, messages: [] }));
    events[eventName].push({ testerType: 'server', sessionId: 'NA', messages: [] });
    events[eventName].push({ testerType: 'tls', sessionId: 'NA', messages: [] });
  }

  // eslint-disable-next-line class-methods-use-this
  testerNamesAndSessions() {
    return events.testerProgress.map(tNAS => ({ testerType: tNAS.testerType, sessionId: tNAS.sessionId }));
  }


  propagateTesterMessage(msgOpts) {
    
    const defaultEvent = 'testerProgress';
    const msgEvents = events[msgOpts.event || defaultEvent].find(record => record.testerType === msgOpts.testerType && record.sessionId === msgOpts.sessionId);
    msgEvents.messages.push(msgOpts.message);
    // (push/shift) Setup as placeholder for proper queue if needed.
    this.emit(msgOpts.event, msgEvents.testerType, msgEvents.sessionId, msgEvents.messages.shift());
  }

  // eslint-disable-next-line class-methods-use-this
  testerSessions() {
    const testerSessions = job.included.filter(resourceObj =>
      resourceObj.type === 'testSession').map((testSessionResObj) => {
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