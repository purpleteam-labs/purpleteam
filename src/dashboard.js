const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { name: projectName } = require('package.json');
const { testerViews, testerPctComplete, statTable } = require('src/views');

const internals = {};

const screen = blessed.screen({
  dump: `${process.cwd()}/logs/dashboard/log.log`,
  smartCSR: true,
  autoPadding: false,
  warnings: true,
  title: projectName
});


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

    subscribeToTesterProgress(testerView.testInstance);

    subscribeToTesterPctComplete((pcts) => {
      const { appPct, serverPct, tlsPct } = pcts;
      
      const colourOfDonut = (pct) => {
        let colourToSet;
        if (pct < 0.2) colourToSet = 'red';
        else if (pct >= 0.2 && pct < 0.7) colourToSet = 'magenta';
        else if (pct >= 0.7) colourToSet = 'blue';
        return colourToSet;
      };
      
      testerPctComplete.instance.update([
        { percent: parseFloat((appPct + 0.00) % 1).toFixed(2), label: 'app', color: colourOfDonut(appPct) },
        { percent: parseFloat((serverPct + 0.00) % 1).toFixed(2), label: 'server', color: colourOfDonut(serverPct) },
        { percent: parseFloat((tlsPct + 0.00) % 1).toFixed(2), label: 'tls', color: colourOfDonut(tlsPct) }
      ]);
      scrn.render();
    });

    statTable.instance.setData({
      headers: ['Testers', 'Complete (%)', 'Threshhold', 'Bugs'],
      data: [['app', 1, 2, 3], ['server', 1, 2, 3], ['tls', 1, 2, 3]]
    });
    statTable.instance.focus();

    scrn.on('resize', () => {
      testerView.testInstance.emit('attach');
      testerPctComplete.instance.emit('attach');
      statTable.instance.emit('attach');
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
