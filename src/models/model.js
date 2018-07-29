let job;
const testerNames = ['app', 'server', 'tls'];


const setAppPctsComplete = (pctsComplete) => {


  // [{ id: 'lowPrivUser', pct: appPct }, { id: 'adminUser', pct: appPct }]
  job.included.forEach((resourceObj) => {
    pctsComplete.forEach((pctObj) => {
      if (resourceObj.type === 'testSession' && resourceObj.id === pctObj.id)
        resourceObj.attributes.appPct = pctObj.pct;
    });
  });
};


const initTesterTestSession = () => {
  job.included.forEach((resourceObj) => {
    if (resourceObj.type === 'testSession') {
      testerNames.forEach((tm) => {
        resourceObj.attributes[`${tn}Pct`] = 0;
        resourceObj.attributes[`${tn}Bugs`] = 0
      });
      debugger;
    }
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
