const blessed = require('blessed');
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
      newBugs: { instance: 'To be assigned', value: 'To be assigned', color: 'To be assigned', elementPadding: 'To be assigned' },
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
      newBugs: { instance: 'To be assigned', value: 'To be assigned', color: 'To be assigned', elementPadding: 'To be assigned' },
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
      newBugs: { instance: 'To be assigned', value: 'To be assigned', color: 'To be assigned', elementPadding: 'To be assigned' },
      totalProgress: { instance: 'To be assigned', percent: 'To be assigned' },
      focussedPage: false
    }
  }
};

const screen = blessed.screen({
  dump: `${process.cwd()}/logs/dashboard/log.log`,
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


const setDataOnTesterPctCompleteWidget = () => {
  const { infoOuts } = internals;
  const testerPctCompleteInstance = infoOuts[testerNames.find(tN => infoOuts[tN].focussedPage)].testerPctComplete.instance;
  testerPctCompleteInstance.update(testerNames.map((tN) => {
    const record = infoOuts[tN].testerPctComplete;
    return { percent: record.percent, label: tN, color: record.color };
  }));  
};


const setDataOnTotalProgressWidget = () => {
  const { infoOuts } = internals;
  const totalProgress = infoOuts[testerNames.find(tN => infoOuts[tN].focussedPage)].totalProgress;
  totalProgress.instance.setStack([{ percent: totalProgress.percent, stroke: 'blue' }, { percent: 100 - totalProgress.percent, stroke: 'red' }]);
};


const handleTesterProgress = (testerType, sessionId, message) => {
  const logger = internals.infoOuts[testerType].loggers.find(l => l.sessionId === sessionId);
  if (logger.instance !== 'To be assigned') logger.instance.log(message);
};


const handleTesterPctComplete = (testerType, sessionId, message) => {
  // statTable
  internals.infoOuts[testerType].statTable.records.find(r => r.sessionId === sessionId).pctComplete = message;
  // testerPctComplete
  internals.infoOuts[testerType].testerPctComplete.percent = internals.infoOuts[testerType].statTable.records.reduce((accum, curr) => accum.pctComplete + curr.pctComplete) / internals.infoOuts[testerType].statTable.records.length;
  console.log(internals.infoOuts[testerType].testerPctComplete.percent);
  internals.infoOuts[testerType].testerPctComplete.color = colourOfDonut(internals.infoOuts[testerType].testerPctComplete.percent);
  // totalProgress
  const pctsComplete = [];
  testerNames.forEach((tN) => {
    pctsComplete.push(...internals.infoOuts[tN].statTable.records.map(r => r.pctComplete));
  });
  const totalProgress = pctsComplete.reduce((accum, curr) => accum + curr) / pctsComplete.length;
  testerNames.forEach((tN) => {
    internals.infoOuts[tN].totalProgress.percent = totalProgress;
  });
  
  // ............ Assign the infoOut values to the view components
  setDataOnStatTableWidget();
  setDataOnTesterPctCompleteWidget();
  setDataOnTotalProgressWidget();
  screen.render();
};


const handleTesterBugCount = (testerType, sessionId, message) => {
  internals.infoOuts[testerType].statTable.records.find(r => r.sessionId === sessionId).bugs = message;
  // ............ Carry on setting up the rest of the infoOuts

  // ............ Assign the infoOut values to the view components
};


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

    newBugs.instance = grid.set(
      newBugsType.gridCoords.row,
      newBugsType.gridCoords.col,
      newBugsType.gridCoords.rowSpan,
      newBugsType.gridCoords.colSpan,
      newBugsType.type,
      newBugsType.args
    );

    totalProgress.instance = grid.set(
      totalProgressType.gridCoords.row,
      totalProgressType.gridCoords.col,
      totalProgressType.gridCoords.rowSpan,
      totalProgressType.gridCoords.colSpan,
      totalProgressType.type,
      totalProgressType.args
    );


    // statTable
    setDataOnStatTableWidget();
    setDataOnTesterPctCompleteWidget();
    setDataOnTotalProgressWidget();


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


    //scrn.render();
/*
    // totalProgress
    let gauge_percent = 0;
    setInterval(() => {
      totalProgress.instance.setStack([{ percent: gauge_percent, stroke: 'blue' }, { percent: 100-gauge_percent, stroke: 'red' }]);
      gauge_percent++;
      if (gauge_percent>=100) gauge_percent = 0;
    }, 200);
  */  


    // There is a bug with the contrib.lcd where if the user makes the screen too small, the characters loose shape.
    // There is another bug with blessed, where there is no parent of the below instances, this exhibits itself in blessed/lib/widgets/element at https://github.com/chjj/blessed/blob/eab243fc7ad27f1d2932db6134f7382825ee3488/lib/widgets/element.js#L1060
    //   https://github.com/chjj/blessed/issues/350
    scrn.on('resize', function () {      
      loggers.forEach(logger => logger.instance.emit('attach'));
      testerPctComplete.instance.parent = this;
      testerPctComplete.instance.emit('attach');
      statTable.instance.emit('attach');      
      // newBugs.instance.emit('attach');
      totalProgress.instance.parent = this;
      totalProgress.instance.emit('attach');
    });
    

  });

  screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0));

  const carousel = new contrib.carousel(carouselPages, { screen, interval: 0, controlKeys: true }); // eslint-disable-line new-cap
  carousel.start();
};


const initTPCarousel = (receiveTestPlan) => {
  const carouselPages = testerViewTypes.map(testerViewType => (scrn) => {
    const grid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap
    const tView = testerViewType;

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


const setupInfoOuts = (testerSessions) => {
  testerNames.forEach((tN) => {
    const sessionsPerTester = testerSessions.filter(t => t.testerType === tN);
    const loggerGridCoordsPetTester = calculateGridCoordsForLoggers(sessionsPerTester.map(row => row.sessionId));
    internals.infoOuts[tN].loggers = sessionsPerTester.map(t => ({ sessionId: t.sessionId, instance: 'To be assigned', gridCoords: loggerGridCoordsPetTester[t.sessionId] }));
    internals.infoOuts[tN].statTable.records = sessionsPerTester.map(t => ({ sessionId: t.sessionId, threshold: t.threshold, bugs: 0, pctComplete: 0 }));
    const testerPctCompleteTypeData = testerPctCompleteType.args.data.find(record => record.label === tN);
    internals.infoOuts[tN].testerPctComplete = { instance: 'To be assigned', percent: testerPctCompleteTypeData.percent, color: testerPctCompleteTypeData.color };
  });
};


const testPlan = receiveTestPlan => new Promise((resolve, reject) => {
  try {
    initTPCarousel(receiveTestPlan);
  } catch (err) {
    return reject(err);
  }
  return resolve();
});


const test = (testerSessions) => {
  setupInfoOuts(testerSessions);
  initCarousel();
};


module.exports = {
  testPlan,
  test,
  handleTesterProgress,
  handleTesterPctComplete,
  handleTesterBugCount
};
