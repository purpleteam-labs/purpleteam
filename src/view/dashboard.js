const config = require('config/config');
// blessed breaks tests, so fake it.
const blessed = require(config.get('modulePaths.blessed')); // eslint-disable-line import/no-dynamic-require
const contrib = require('blessed-contrib');
const { name: projectName } = require('package.json');
const { testerViewTypes, testerPctCompleteType, statTableType, newBugsType, totalProgressType } = require('src/view/types');

const testerNames = testerViewTypes.map(tv => tv.testOpts.args.name);

const internals = {
  infoOuts: {
    app: {
      loggers: [/* {
        sessionId: '<sessionId>', instance: testerViewType.testInstance, gridCoords: { row: , col: , rowSpan: , colSpan: }
      }, {
        sessionId: '<sessionId>', instance: testerViewType.testInstance, gridCoords: { row: , col: , rowSpan: , colSpan: }
      } */],
      testerPctComplete: { instance: 'To be assigned', percent: 'To be assigned', color: 'To be assigned' },
      statTable: {
        instance: 'To be assigned',
        records: [/* {
          sessionId: '<sessionId>', threshold: <threshold>, bugs: 0, pctComplete: 0
        }, {
          sessionId: '<sessionId>', threshold: <threshold>, bugs: 0, pctComplete: 0
        } */]
      },
      newBugs: { instance: 'To be assigned', value: 'To be assigned', color: 'To be assigned' },
      totalProgress: { instance: 'To be assigned', percent: 'To be assigned' },
      focussedPage: false
    },
    server: {
      loggers: [],
      testerPctComplete: { instance: 'To be assigned', percent: 'To be assigned', color: 'To be assigned' },
      statTable: {
        instance: 'To be assigned',
        records: []
      },
      newBugs: { instance: 'To be assigned', value: 'To be assigned', color: 'To be assigned' },
      totalProgress: { instance: 'To be assigned', percent: 'To be assigned' },
      focussedPage: false
    },
    tls: {
      loggers: [],
      testerPctComplete: { instance: 'To be assigned', percent: 'To be assigned', color: 'To be assigned' },
      statTable: {
        instance: 'To be assigned',
        records: []
      },
      newBugs: { instance: 'To be assigned', value: 'To be assigned', color: 'To be assigned' },
      totalProgress: { instance: 'To be assigned', percent: 'To be assigned' },
      focussedPage: false
    }
  }
};

const screen = blessed.screen({
  // dump: `${process.cwd()}/logs/dashboard/log.log`,
  smartCSR: true,
  autoPadding: false,
  warnings: true,
  title: projectName
});


const colourOfDonut = (pct) => {
  let colourToSet;
  if (pct < 20) colourToSet = 'red';
  else if (pct >= 20 && pct < 70) colourToSet = 'magenta';
  else if (pct >= 70) colourToSet = 'blue';
  return colourToSet;
};


const setDataOnTesterPctCompleteWidget = () => {
  const { infoOuts } = internals;
  const testerPctCompleteInstance = infoOuts[testerNames.find(tN => infoOuts[tN].focussedPage)].testerPctComplete.instance;
  testerPctCompleteInstance.update(testerNames.map((tN) => {
    const record = infoOuts[tN].testerPctComplete;
    return { percent: record.percent, label: tN, color: record.color };
  }));
};


const setDataOnStatTableWidget = () => {
  const { infoOuts } = internals;
  const statTableInstance = infoOuts[testerNames.find(tN => infoOuts[tN].focussedPage)].statTable.instance;
  statTableInstance.setData({
    headers: statTableType.headers,
    data: (() => {
      const statTableDataRows = [];
      testerNames.forEach((tn) => {
        statTableDataRows.push(...infoOuts[tn].statTable.records.map(row => [tn, row.sessionId, row.threshold, row.bugs, row.pctComplete]));
      });
      return statTableDataRows;
    })()
  });
  statTableInstance.focus();
};


const setDataOnNewBugsWidget = () => {
  const { infoOuts } = internals;
  const newBugs = infoOuts[testerNames.find(tN => infoOuts[tN].focussedPage)].newBugs; // eslint-disable-line prefer-destructuring
  newBugs.instance.setDisplay(newBugs.value);
  newBugs.instance.setOptions({ color: newBugs.color });
};


const setDataOnTotalProgressWidget = () => {
  const { infoOuts } = internals;
  const { totalProgress } = infoOuts[testerNames.find(tN => infoOuts[tN].focussedPage)];
  let roundedPercent = Math.round(totalProgress.percent);
  // Bug in the blessed contrib component that does't render the guage propertly if percent is 1 or less.
  if (roundedPercent <= 1) roundedPercent = 0;
  totalProgress.instance.setStack([{ percent: roundedPercent, stroke: 'blue' }, { percent: 100 - roundedPercent, stroke: 'red' }]);
};


// Assign the infoOut values to the view components
const setDataOnAllPageWidgets = () => {
  setDataOnTesterPctCompleteWidget();
  setDataOnStatTableWidget();
  setDataOnNewBugsWidget();
  setDataOnTotalProgressWidget();
  screen.render();
};


const handleTesterProgress = (testerType, sessionId, message) => {
  const logger = internals.infoOuts[testerType].loggers.find(l => l.sessionId === sessionId);
  if (logger.instance !== 'To be assigned') {
    try {
      const lines = message.split('\n');
      lines.forEach((line) => { logger.instance.log(line); });
    } catch (e) {
      throw new Error(`An error occurred while attempting to split a testerProgress event message. The message was "${message}", the error was "${e}"`);
    }
  }
};


const handleTesterPctComplete = (testerType, sessionId, message) => {
  const { infoOuts } = internals;
  // statTable
  infoOuts[testerType].statTable.records.find(r => r.sessionId === sessionId).pctComplete = Math.round(message);
  // testerPctComplete
  infoOuts[testerType].testerPctComplete.percent = infoOuts[testerType]
    .statTable.records.reduce((accum, curr) => accum.pctComplete + curr.pctComplete) / infoOuts[testerType].statTable.records.length;
  infoOuts[testerType].testerPctComplete.color = colourOfDonut(infoOuts[testerType].testerPctComplete.percent);
  // totalProgress
  const pctsComplete = [];
  testerNames.forEach((tN) => {
    pctsComplete.push(...infoOuts[tN].statTable.records.map(r => r.pctComplete));
  });
  const totalProgress = pctsComplete.reduce((accum, curr) => accum + curr) / pctsComplete.length;
  testerNames.forEach((tN) => {
    infoOuts[tN].totalProgress.percent = totalProgress;
  });
  setDataOnAllPageWidgets();
};


const handleTesterBugCount = (testerType, sessionId, message) => {
  const { infoOuts } = internals;
  // statTable
  const statTableRecord = infoOuts[testerType].statTable.records.find(r => r.sessionId === sessionId);
  statTableRecord.bugs = message;
  // Collect
  const statTableRecords = (() => {
    const rows = [];
    testerNames.forEach((tN) => { rows.push(...infoOuts[tN].statTable.records); });
    return rows;
  })();
  // Calculate
  let newBugs = 0;
  statTableRecords.forEach((r) => { newBugs += r.bugs > r.threshold ? r.bugs - r.threshold : 0; });
  // Populate
  testerNames.forEach((tN) => {
    if (newBugs) {
      const newBugsObj = infoOuts[tN].newBugs;
      newBugsObj.value = newBugs;
      newBugsObj.color = 'red';
      newBugsObj.elementPadding = 4;
    }
  });
  setDataOnAllPageWidgets();
};

/* $lab:coverage:off$ */
const calculateGridCoordsForLoggers = (sessionIds) => {
  const loggerCount = sessionIds.length;

  const layout = {
    1: { [sessionIds[0]]: { row: 0, col: 0, rowSpan: 10.5, colSpan: 12 } },
    2: {
      [sessionIds[0]]: { row: 0, col: 0, rowSpan: 5.25, colSpan: 12 },
      [sessionIds[1]]: { row: 5.25, col: 0, rowSpan: 5.25, colSpan: 12 }
    },
    3: {
      [sessionIds[0]]: { row: 0, col: 0, rowSpan: 3.5, colSpan: 12 },
      [sessionIds[1]]: { row: 3.5, col: 0, rowSpan: 3.5, colSpan: 12 },
      [sessionIds[2]]: { row: 7, col: 0, rowSpan: 3.5, colSpan: 12 }
    },
    4: {
      [sessionIds[0]]: { row: 0, col: 0, rowSpan: 3.5, colSpan: 12 },
      [sessionIds[1]]: { row: 3.5, col: 0, rowSpan: 3.5, colSpan: 12 },
      [sessionIds[2]]: { row: 7, col: 0, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[3]]: { row: 7, col: 6, rowSpan: 3.5, colSpan: 6 }
    },
    5: {
      [sessionIds[0]]: { row: 0, col: 0, rowSpan: 3.5, colSpan: 12 },
      [sessionIds[1]]: { row: 3.5, col: 0, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[2]]: { row: 3.5, col: 6, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[3]]: { row: 7, col: 0, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[4]]: { row: 7, col: 6, rowSpan: 3.5, colSpan: 6 }
    },
    6: {
      [sessionIds[0]]: { row: 0, col: 0, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[1]]: { row: 0, col: 6, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[2]]: { row: 3.5, col: 0, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[3]]: { row: 3.5, col: 6, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[4]]: { row: 7, col: 0, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[5]]: { row: 7, col: 6, rowSpan: 3.5, colSpan: 6 }
    },
    7: {
      [sessionIds[0]]: { row: 0, col: 0, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[1]]: { row: 0, col: 6, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[2]]: { row: 3.5, col: 0, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[3]]: { row: 3.5, col: 6, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[4]]: { row: 7, col: 0, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[5]]: { row: 7, col: 4, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[6]]: { row: 7, col: 8, rowSpan: 3.5, colSpan: 4 }
    },
    8: {
      [sessionIds[0]]: { row: 0, col: 0, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[1]]: { row: 0, col: 6, rowSpan: 3.5, colSpan: 6 },
      [sessionIds[2]]: { row: 3.5, col: 0, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[3]]: { row: 3.5, col: 4, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[4]]: { row: 3.5, col: 8, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[5]]: { row: 7, col: 0, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[6]]: { row: 7, col: 4, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[7]]: { row: 7, col: 8, rowSpan: 3.5, colSpan: 4 }
    },
    9: {
      [sessionIds[0]]: { row: 0, col: 0, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[1]]: { row: 0, col: 4, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[2]]: { row: 0, col: 8, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[3]]: { row: 3.5, col: 0, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[4]]: { row: 3.5, col: 4, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[5]]: { row: 3.5, col: 8, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[6]]: { row: 7, col: 0, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[7]]: { row: 7, col: 4, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[8]]: { row: 7, col: 8, rowSpan: 3.5, colSpan: 4 }
    },
    10: {
      [sessionIds[0]]: { row: 0, col: 0, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[1]]: { row: 0, col: 4, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[2]]: { row: 0, col: 8, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[3]]: { row: 3.5, col: 0, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[4]]: { row: 3.5, col: 4, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[5]]: { row: 3.5, col: 8, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[6]]: { row: 7, col: 0, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[7]]: { row: 7, col: 3, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[8]]: { row: 7, col: 6, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[9]]: { row: 7, col: 9, rowSpan: 3.5, colSpan: 3 }
    },
    11: {
      [sessionIds[0]]: { row: 0, col: 0, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[1]]: { row: 0, col: 4, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[2]]: { row: 0, col: 8, rowSpan: 3.5, colSpan: 4 },
      [sessionIds[3]]: { row: 3.5, col: 0, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[4]]: { row: 3.5, col: 3, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[5]]: { row: 3.5, col: 6, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[6]]: { row: 3.5, col: 9, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[7]]: { row: 7, col: 0, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[8]]: { row: 7, col: 3, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[9]]: { row: 7, col: 6, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[10]]: { row: 7, col: 9, rowSpan: 3.5, colSpan: 3 }
    },
    12: {
      [sessionIds[0]]: { row: 0, col: 0, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[1]]: { row: 0, col: 3, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[2]]: { row: 0, col: 6, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[3]]: { row: 0, col: 9, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[4]]: { row: 3.5, col: 0, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[5]]: { row: 3.5, col: 3, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[6]]: { row: 3.5, col: 6, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[7]]: { row: 3.5, col: 9, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[8]]: { row: 7, col: 0, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[9]]: { row: 7, col: 3, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[10]]: { row: 7, col: 6, rowSpan: 3.5, colSpan: 3 },
      [sessionIds[11]]: { row: 7, col: 9, rowSpan: 10.5, colSpan: 3 }
    }
  };

  return layout[`${loggerCount}`];
};


const initCarousel = () => {
  const carouselPages = testerViewTypes.map(testerViewType => (scrn) => {
    const grid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap
    const testerType = testerViewType.testOpts.args.name;

    const { loggers, testerPctComplete, statTable, newBugs, totalProgress } = internals.infoOuts[testerType];

    testerNames.forEach((tN) => { internals.infoOuts[tN].focussedPage = testerType === tN; });

    // One per test session, per tester.
    loggers.forEach((logger) => {
      const { bufferLength, label, name, style, tags } = testerViewType.testOpts.args;
      logger.instance = grid.set( // eslint-disable-line no-param-reassign
        logger.gridCoords.row,
        logger.gridCoords.col,
        logger.gridCoords.rowSpan,
        logger.gridCoords.colSpan,
        testerViewType.testOpts.type,
        { bufferLength, label: `${label} - Session: ${logger.sessionId}`, name, style, tags }
      );
    });

    testerPctComplete.instance = grid.set(
      testerPctCompleteType.gridCoords.row,
      testerPctCompleteType.gridCoords.col,
      testerPctCompleteType.gridCoords.rowSpan,
      testerPctCompleteType.gridCoords.colSpan,
      testerPctCompleteType.type,
      testerPctCompleteType.args
    );

    statTable.instance = grid.set(
      statTableType.gridCoords.row,
      statTableType.gridCoords.col,
      statTableType.gridCoords.rowSpan,
      statTableType.gridCoords.colSpan,
      statTableType.type,
      statTableType.args
    );

    const newBugsArgs = newBugsType.args;
    newBugsArgs.color = newBugs.color;

    newBugs.instance = grid.set(
      newBugsType.gridCoords.row,
      newBugsType.gridCoords.col,
      newBugsType.gridCoords.rowSpan,
      newBugsType.gridCoords.colSpan,
      newBugsType.type,
      newBugsArgs
    );

    totalProgress.instance = grid.set(
      totalProgressType.gridCoords.row,
      totalProgressType.gridCoords.col,
      totalProgressType.gridCoords.rowSpan,
      totalProgressType.gridCoords.colSpan,
      totalProgressType.type,
      totalProgressType.args
    );

    setDataOnAllPageWidgets();

    // There is a bug with the contrib.lcd where if the user makes the screen too small, the characters loose shape.
    // There is another bug with blessed, where there is no parent of the below instances, this exhibits itself in blessed/lib/widgets/element at https://github.com/chjj/blessed/blob/eab243fc7ad27f1d2932db6134f7382825ee3488/lib/widgets/element.js#L1060
    //   https://github.com/chjj/blessed/issues/350
    scrn.on('resize', function resizeHandler() {
      loggers.forEach(logger => logger.instance.emit('attach'));
      testerPctComplete.instance.parent = this;
      testerPctComplete.instance.emit('attach');
      statTable.instance.emit('attach');
      // newBugs.instance.emit('attach'); // Doesn't work, buggy blessed.
      totalProgress.instance.parent = this;
      totalProgress.instance.emit('attach');
    });
  });

  screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0)); // eslint-disable-line no-unused-vars

  const carousel = new contrib.carousel(carouselPages, { screen, interval: 0, controlKeys: true }); // eslint-disable-line new-cap
  carousel.start();
};


const setDataOnLogWidget = (testPlans) => {
  const { infoOuts } = internals;
  const testerName = testerNames.find(tN => infoOuts[tN].focussedPage);
  const logger = infoOuts[testerName].loggers;
  logger.instance.log(testPlans.find(plan => plan.name === testerName).message);
};


const initTPCarousel = (testPlans) => {
  const carouselPages = testerViewTypes.map(testerViewType => (scrn) => {
    const grid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap
    const testerType = testerViewType.testPlanOpts.args.name;

    testerNames.forEach((tN) => { internals.infoOuts[tN].focussedPage = testerType === tN; });

    internals.infoOuts[testerType].loggers = {
      instance: grid.set(
        testerViewType.testPlanOpts.gridCoords.row,
        testerViewType.testPlanOpts.gridCoords.col,
        testerViewType.testPlanOpts.gridCoords.rowSpan,
        testerViewType.testPlanOpts.gridCoords.colSpan,
        testerViewType.testPlanOpts.type,
        testerViewType.testPlanOpts.args
      )
    };

    setDataOnLogWidget(testPlans);
  });

  screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0)); // eslint-disable-line no-unused-vars

  const carousel = new contrib.carousel(carouselPages, { screen, interval: 0, controlKeys: true }); // eslint-disable-line new-cap
  carousel.start();
};
/* $lab:coverage:on$ */

const setupInfoOutsForTest = (testerSessions) => {
  testerNames.forEach((tN) => {
    const { infoOuts } = internals;
    const sessionsPerTester = testerSessions.filter(t => t.testerType === tN);
    const loggerGridCoordsPerTester = calculateGridCoordsForLoggers(sessionsPerTester.map(row => row.sessionId));
    infoOuts[tN].loggers = sessionsPerTester.map(t => ({ sessionId: t.sessionId, instance: 'To be assigned', gridCoords: loggerGridCoordsPerTester[t.sessionId] }));
    infoOuts[tN].statTable.records = sessionsPerTester.map(t => ({ sessionId: t.sessionId, threshold: t.threshold, bugs: 0, pctComplete: 0 }));
    const testerPctCompleteTypeData = testerPctCompleteType.args.data.find(record => record.label === tN);
    infoOuts[tN].testerPctComplete = { instance: 'To be assigned', percent: testerPctCompleteTypeData.percent, color: testerPctCompleteTypeData.color };
    const newBugsTypeData = newBugsType.args;
    infoOuts[tN].newBugs = { instance: 'To be assigned', value: newBugsTypeData.display, color: newBugsTypeData.color, elementPadding: newBugsTypeData.elementPadding };
  });
};


const testPlan = (testPlans) => {
  initTPCarousel(testPlans);
};


const test = (testerSessions) => {
  setupInfoOutsForTest(testerSessions);
  initCarousel();
};


module.exports = {
  testPlan,
  test,
  handleTesterProgress,
  handleTesterPctComplete,
  handleTesterBugCount
};
