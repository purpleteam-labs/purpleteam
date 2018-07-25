const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { name: projectName } = require('package.json');
const { app: appView, server: serverView, tls: tlsView, testerPctComplete } = require('src/views');

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

  const appPage = (scrn) => {
    const grid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    // One per test session
    appView.testInstance = grid.set(
      appView.testOpts.gridCoords.row,
      appView.testOpts.gridCoords.col,
      appView.testOpts.gridCoords.rowSpan,
      appView.testOpts.gridCoords.colSpan,
      appView.testOpts.type,
      appView.testOpts.args
    );

    testerPctComplete.instance = grid.set(
      testerPctComplete.gridCoords.row,
      testerPctComplete.gridCoords.col,
      testerPctComplete.gridCoords.rowSpan,
      testerPctComplete.gridCoords.colSpan,
      testerPctComplete.type,
      testerPctComplete.args
    );

    subscribeToTesterProgress(appView.testInstance);

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

    scrn.on('resize', () => {
      appView.testInstance.emit('attach');
      testerPctComplete.instance.emit('attach');
    });
  };

  const serverPage = (scrn) => {
    const grid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    serverView.testInstance = grid.set(
      serverView.testOpts.gridCoords.row,
      serverView.testOpts.gridCoords.col,
      serverView.testOpts.gridCoords.rowSpan,
      serverView.testOpts.gridCoords.colSpan,
      serverView.testOpts.type,
      serverView.testOpts.args
    );

    testerPctComplete.instance = grid.set(
      testerPctComplete.gridCoords.row,
      testerPctComplete.gridCoords.col,
      testerPctComplete.gridCoords.rowSpan,
      testerPctComplete.gridCoords.colSpan,
      testerPctComplete.type,
      testerPctComplete.args
    );

    subscribeToTesterProgress(serverView.testInstance);

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

    scrn.on('resize', () => {
      serverView.testInstance.emit('attach');
      testerPctComplete.instance.emit('attach');
    });
  };

  const tlsPage = (scrn) => {
    const grid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    tlsView.testInstance = grid.set(
      tlsView.testOpts.gridCoords.row,
      tlsView.testOpts.gridCoords.col,
      tlsView.testOpts.gridCoords.rowSpan,
      tlsView.testOpts.gridCoords.colSpan,
      tlsView.testOpts.type,
      tlsView.testOpts.args
    );

    testerPctComplete.instance = grid.set(
      testerPctComplete.gridCoords.row,
      testerPctComplete.gridCoords.col,
      testerPctComplete.gridCoords.rowSpan,
      testerPctComplete.gridCoords.colSpan,
      testerPctComplete.type,
      testerPctComplete.args
    );

    subscribeToTesterProgress(tlsView.testInstance);

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

    scrn.on('resize', () => {
      tlsView.testInstance.emit('attach');
      testerPctComplete.instance.emit('attach');
    });
  };

  screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0));

  const carousel = new contrib.carousel([appPage, serverPage, tlsPage], { screen, interval: 0, controlKeys: true }); // eslint-disable-line new-cap
  carousel.start();
};


const initTPCarousel = (receiveTestPlan) => {
  const page1 = (scrn) => {
    const appGrid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    appView.testPlanInstance = appGrid.set(
      appView.testPlanOpts.gridCoords.row,
      appView.testPlanOpts.gridCoords.col,
      appView.testPlanOpts.gridCoords.rowSpan,
      appView.testPlanOpts.gridCoords.colSpan,
      appView.testPlanOpts.type,
      appView.testPlanOpts.args
    );

    receiveTestPlan(appView.testPlanInstance);
  };

  const page2 = (scrn) => {
    const serverGrid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    serverView.testPlanInstance = serverGrid.set(
      serverView.testPlanOpts.gridCoords.row,
      serverView.testPlanOpts.gridCoords.col,
      serverView.testPlanOpts.gridCoords.rowSpan,
      serverView.testPlanOpts.gridCoords.colSpan,
      serverView.testPlanOpts.type,
      serverView.testPlanOpts.args
    );

    receiveTestPlan(serverView.testPlanInstance);
  };

  const page3 = (scrn) => {
    const tlsGrid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    tlsView.testPlanInstance = tlsGrid.set(
      tlsView.testPlanOpts.gridCoords.row,
      tlsView.testPlanOpts.gridCoords.col,
      tlsView.testPlanOpts.gridCoords.rowSpan,
      tlsView.testPlanOpts.gridCoords.colSpan,
      tlsView.testPlanOpts.type,
      tlsView.testPlanOpts.args
    );

    receiveTestPlan(tlsView.testPlanInstance);
  };

  screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0));

  const carousel = new contrib.carousel([page1, page2, page3], { screen, interval: 0, controlKeys: true }); // eslint-disable-line new-cap
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
