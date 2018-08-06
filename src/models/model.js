const EventEmitter = require('events');

let job;
let testerMessages;

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


const init = (buildUserConfig) => {
  job = JSON.parse(buildUserConfig);

  // initTesterPctsPerTestSession();
};

module.exports = {
  init,
  setAppPctsComplete
};
*/




class Model extends EventEmitter {
  constructor(options) {
    debugger;
    super();
    job = JSON.parse(options);
    this.initTesterMessages();
  }


  initTesterMessages() {
    testerMessages = job.included.filter(resourceObj =>
      resourceObj.type === 'testSession').map(testSessionResObj =>
      ({ testerType: 'app', sessionId: testSessionResObj.id, messages: [] }));
    testerMessages.push({ testerType: 'server', sessionId: 'NA', messages: [] });
    testerMessages.push({ testerType: 'tls', sessionId: 'NA', messages: [] });    
  }

  testerNamesAndSessions() {
    return testerMessages.map(tNAS => ({ testerType: tNAS.testerType, sessionId: tNAS.sessionId }));
  }


  propagateTesterMessage(msgOpts) {    
    const messages = testerMessages.find(record =>
      record.testerType === msgOpts.testerType && record.sessionId === msgOpts.sessionId
    );
    messages.messages.push(msgOpts.message);
    // Setup as placeholder for proper queue if needed.
    this.emit('testerMessage', messages.testerType, messages.sessionId, messages.messages.shift());
  }


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
