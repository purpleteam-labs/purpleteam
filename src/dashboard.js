const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { name: projectName } = require('package.json');
const { testerViews, testerPctComplete, statTable, newBugs, totalProgress } = require('src/views');

const internals = {};

const screen = blessed.screen({
  dump: `${process.cwd()}/logs/dashboard/log.log`,
  smartCSR: true,
  autoPadding: false,
  warnings: true,
  title: projectName
});


const updateTesterPctsComplete = (pcts) => {
  const colourOfDonut = (pct) => {
    let colourToSet;
    if (pct < 0.2) colourToSet = 'red';
    else if (pct >= 0.2 && pct < 0.7) colourToSet = 'magenta';
    else if (pct >= 0.7) colourToSet = 'blue';
    return colourToSet;
  };

  testerPctComplete.instance.update(testerViews.map((tv) => {
    const { name } = tv.testOpts.args;
    return { percent: parseFloat((pcts[name] + 0.00) % 1).toFixed(2), label: name, color: colourOfDonut(pcts[name]) };
  }));
};


const applyTesterPctsComplete = (pcts) => {
  updateTesterPctsComplete(pcts);
};


const initCarousel = (subscriptions) => {
  const { subscribeToTesterProgress, subscribeToTesterPctComplete } = subscriptions;

  const carouselPages = testerViews.map(testerView => (scrn) => {
    const grid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap
    const tView = testerView;

    // Todo: One per test session
    tView.testInstance = grid.set(
      testerView.testOpts.gridCoords.row,
      testerView.testOpts.gridCoords.col,
      testerView.testOpts.gridCoords.rowSpan,
      testerView.testOpts.gridCoords.colSpan,
      testerView.testOpts.type,
      testerView.testOpts.args
    );

    testerPctComplete.instance = grid.set(
      testerPctComplete.gridCoords.row,
      testerPctComplete.gridCoords.col,
      testerPctComplete.gridCoords.rowSpan,
      testerPctComplete.gridCoords.colSpan,
      testerPctComplete.type,
      testerPctComplete.args
    );

    statTable.instance = grid.set(
      statTable.gridCoords.row,
      statTable.gridCoords.col,
      statTable.gridCoords.rowSpan,
      statTable.gridCoords.colSpan,
      statTable.type,
      statTable.args
    );

    newBugs.instance = grid.set(
      newBugs.gridCoords.row,
      newBugs.gridCoords.col,
      newBugs.gridCoords.rowSpan,
      newBugs.gridCoords.colSpan,
      newBugs.type,
      newBugs.args
    );

    totalProgress.instance = grid.set(
      totalProgress.gridCoords.row,
      totalProgress.gridCoords.col,
      totalProgress.gridCoords.rowSpan,
      totalProgress.gridCoords.colSpan,
      totalProgress.type,
      totalProgress.args
    );

    subscribeToTesterProgress(testerView.testInstance);

    subscribeToTesterPctComplete((pcts) => {
      applyTesterPctsComplete(pcts);


      scrn.render();
    });

    // statTable
    statTable.instance.setData({
      headers: statTable.headers,
      data: statTable.seedData
    });
    statTable.instance.focus();


    // newBugs
    setInterval(() => {
      const colors = ['green','magenta','cyan','red','blue'];
      const text = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    
      var value = Math.round(Math.random() * 100);
      newBugs.instance.setDisplay(value);
      newBugs.instance.setOptions({
        color: colors[value%5],
        elementPadding: 4
      });
      scrn.render();
    }, 1500);


    // totalProgress
    let gauge_percent = 0;
    setInterval(() => {
      totalProgress.instance.setStack([{ percent: gauge_percent, stroke: 'blue' }, { percent: 100-gauge_percent, stroke: 'red' }]);
      gauge_percent++;
      if (gauge_percent>=100) gauge_percent = 0;
    }, 200)    





    scrn.on('resize', () => {
      testerView.testInstance.emit('attach');
      testerPctComplete.instance.emit('attach');
      statTable.instance.emit('attach');
      //newBugs.instance.emit('attach');
      totalProgress.instance.emit('attach');
    });
  });

  screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0));

  const carousel = new contrib.carousel(carouselPages, { screen, interval: 0, controlKeys: true }); // eslint-disable-line new-cap
  carousel.start();
};


const initTPCarousel = (receiveTestPlan) => {
  const carouselPages = testerViews.map(testerView => (scrn) => {
    const grid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap
    const tView = testerView;

    tView.testPlanInstance = grid.set(
      tView.testPlanOpts.gridCoords.row,
      tView.testPlanOpts.gridCoords.col,
      tView.testPlanOpts.gridCoords.rowSpan,
      tView.testPlanOpts.gridCoords.colSpan,
      tView.testPlanOpts.type,
      tView.testPlanOpts.args
    );

    receiveTestPlan(tView.testPlanInstance);
  });

  screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0));

  const carousel = new contrib.carousel(carouselPages, { screen, interval: 0, controlKeys: true }); // eslint-disable-line new-cap
  carousel.start();
};


const testPlan = receiveTestPlan => new Promise((resolve, reject) => {
  try {
    initTPCarousel(receiveTestPlan);
  } catch (err) {
    return reject(err);
  }
  return resolve();
});


const test = subscriptions => new Promise((resolve, reject) => {
  try {
    initCarousel(subscriptions);
  } catch (err) {
    return reject(err);
  }
  return resolve();
});


module.exports = {
  testPlan,
  test
};
