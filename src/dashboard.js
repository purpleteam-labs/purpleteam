const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { name: projectName } = require('package.json');

const screen = blessed.screen({
  dump: `${process.cwd()}/logs/dashboard/log.log`,
  smartCSR: true,
  autoPadding: false,
  warnings: true,
  title: projectName
});

const internals = {
  logTail: {
    app: {
      gridCoords: {
        row: 0,
        col: 0,
        rowSpan: 3.5,
        colSpan: 12
      },
      type: contrib.log,
      args: {
        label: 'app tester',
        style: {
          fg: 'default',
          gb: 'default',
          border: {
            fg: 'magenta',
            bg: 'default'
          }
        },
        tags: 'true',
        name: 'app'
      },
      instance: undefined
    },
    server: {
      gridCoords: {
        row: 3.5,
        col: 0,
        rowSpan: 3.5,
        colSpan: 12
      },
      type: contrib.log,
      args: {
        label: 'server tester',
        style: {
          fg: 'default',
          gb: 'default',
          border: {
            fg: 'magenta',
            bg: 'default'
          }
        },
        tags: 'true',
        name: 'server'
      },
      instance: undefined
    },
    tls: {
      gridCoords: {
        row: 7,
        col: 0,
        rowSpan: 3.5,
        colSpan: 12
      },
      type: contrib.log,
      args: {
        label: 'tls tester',
        style: {
          fg: 'default',
          gb: 'default',
          border: {
            fg: 'magenta',
            bg: 'default'
          }
        },
        tags: 'true',
        name: 'tls'
      },
      instance: undefined
    }
  },
  logScroll: {
    app: {
      gridCoords: {
        row: 0,
        col: 0,
        rowSpan: 1.5,
        colSpan: 12
      },
      type: blessed.log,
      args: {
        label: 'test plan',
        mouse: true,
        scrollable: true,
        tags: true,
        keys: true,
        vi: true,
        style: {
          fg: 'default',
          gb: 'default',
          border: {
            fg: 'magenta',
            bg: 'default'
          }
        },
        border: {
          type: 'line',
          fg: '#00ff00'
        },
        hover: {
          bg: 'blue'
        },
        scrollbar: {
          ch: ' ',
          track: {
            bg: 'magenta'
          },
          style: {
            inverse: true
          }
        },
        name: 'app'
      },
      instance: undefined
    }
  }
};


// eslint-disable-next-line new-cap
const grid = new contrib.grid({ rows: 12, cols: 12, screen });


const initTestPlanGrid = () => {
  internals.logScroll.app.instance = grid.set(
    internals.logScroll.app.gridCoords.row,
    internals.logScroll.app.gridCoords.col,
    internals.logScroll.app.gridCoords.rowSpan,
    internals.logScroll.app.gridCoords.colSpan,
    internals.logScroll.app.type,
    internals.logScroll.app.args
  );

  screen.key('q', () => screen.destroy());
  screen.render();
};


const initTestGrid = () => {
  internals.logTail.app.instance = grid.set(
    internals.logTail.app.gridCoords.row,
    internals.logTail.app.gridCoords.col,
    internals.logTail.app.gridCoords.rowSpan,
    internals.logTail.app.gridCoords.colSpan,
    internals.logTail.app.type,
    internals.logTail.app.args
  );

  internals.logTail.server.instance = grid.set(
    internals.logTail.server.gridCoords.row,
    internals.logTail.server.gridCoords.col,
    internals.logTail.server.gridCoords.rowSpan,
    internals.logTail.server.gridCoords.colSpan,
    internals.logTail.server.type,
    internals.logTail.server.args
  );

  internals.logTail.tls.instance = grid.set(
    internals.logTail.tls.gridCoords.row,
    internals.logTail.tls.gridCoords.col,
    internals.logTail.tls.gridCoords.rowSpan,
    internals.logTail.tls.gridCoords.colSpan,
    internals.logTail.tls.type,
    internals.logTail.tls.args
  );

  screen.key('q', () => screen.destroy());
  screen.render();
};


const testPlan = recieveTestPlans => new Promise((resolve, reject) => {
  try {
    initTestPlanGrid();
    recieveTestPlans([
      internals.logScroll.app.instance
    ]);
  } catch (err) {
    return reject(err);
  }
  return resolve(screen);
});


const test = subscribeToTestersProgress => new Promise((resolve, reject) => {
  try {
    initTestGrid();
    subscribeToTestersProgress([
      internals.logTail.app.instance,
      internals.logTail.server.instance,
      internals.logTail.tls.instance
    ]);
  } catch (err) {
    return reject(err);
  }
  return resolve(screen);
});


module.exports = {
  testPlan,
  test
};
