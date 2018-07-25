const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { name: projectName } = require('package.json');


const internals = {
  logTail: {
    app: {
      gridCoords: {
        row: 0,
        col: 0,
        rowSpan: 10.5,
        colSpan: 12
      },
      type: contrib.log,
      args: {
        label: 'App Tester',
        style: {
          fg: 'default',
          bg: 'default',
          border: {
            fg: 'magenta',
            bg: 'default'
          }
        },
        bufferLength: 1000,
        tags: 'true',
        name: 'app'
      },
      instance: undefined
    },
    server: {
      gridCoords: {
        row: 0,
        col: 0,
        rowSpan: 10.5,
        colSpan: 12
      },
      type: contrib.log,
      args: {
        label: 'Server Tester',
        style: {
          fg: 'default',
          bg: 'default',
          border: {
            fg: 'magenta',
            bg: 'default'
          }
        },
        bufferLength: 1000,
        tags: 'true',
        name: 'server'
      },
      instance: undefined
    },
    tls: {
      gridCoords: {
        row: 0,
        col: 0,
        rowSpan: 10.5,
        colSpan: 12
      },
      type: contrib.log,
      args: {
        label: 'TLS Tester',
        style: {
          fg: 'default',
          bg: 'default',
          border: {
            fg: 'magenta',
            bg: 'default'
          }
        },
        bufferLength: 1000,
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
        rowSpan: 10.5,
        colSpan: 12
      },
      type: blessed.log,
      args: {
        label: 'App Test Plan',
        mouse: true,
        scrollable: true,
        tags: true,
        keys: true,
        vi: true,
        style: {
          fg: 'default',
          bg: 'default',
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
    },
    server: {
      gridCoords: {
        row: 0,
        col: 0,
        rowSpan: 10.5,
        colSpan: 12
      },
      type: blessed.log,
      args: {
        label: 'Server Test Plan',
        mouse: true,
        scrollable: true,
        tags: true,
        keys: true,
        vi: true,
        style: {
          fg: 'default',
          bg: 'default',
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
        name: 'server'
      },
      instance: undefined
    },
    tls: {
      gridCoords: {
        row: 0,
        col: 0,
        rowSpan: 10.5,
        colSpan: 12
      },
      type: blessed.log,
      args: {
        label: 'TLS Test Plan',
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
        name: 'tls'
      },
      instance: undefined
    }
  },
  donut: {
    app: {
      gridCoords: {
        row: 10.5,
        col: 0,
        rowSpan: 1.6,
        colSpan: 3
      },
      type: contrib.donut,
      args: {
        label: 'Tester % Complete',
        radius: 8,
        arcWidth: 3,
        remainColor: 'black',
        yPadding: 3,
        data: [
          { label: 'app', percent: 0, color: 'red' },
          { label: 'server', percent: 0, color: 'red' },
          { label: 'tls', percent: 0, color: 'red' }
        ],
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
      },
      instance: undefined
    }
  }
};




const initCarousel = (subscriptions) => {

  const { subscribeToTesterProgress, subscribeToTesterPctComplete } = subscriptions;

  const screen = blessed.screen({
    dump: `${process.cwd()}/logs/dashboard/log.log`,
    smartCSR: true,
    autoPadding: false,
    warnings: true,
    title: projectName
  });
  const page1 = (scrn) => {
    const appGrid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    // One per test session
    internals.logTail.app.instance = appGrid.set(
      internals.logTail.app.gridCoords.row,
      internals.logTail.app.gridCoords.col,
      internals.logTail.app.gridCoords.rowSpan,
      internals.logTail.app.gridCoords.colSpan,
      internals.logTail.app.type,
      internals.logTail.app.args
    );

    internals.donut.app.instance = appGrid.set(
      internals.donut.app.gridCoords.row,
      internals.donut.app.gridCoords.col,
      internals.donut.app.gridCoords.rowSpan,
      internals.donut.app.gridCoords.colSpan,
      internals.donut.app.type,
      internals.donut.app.args
    );


    subscribeToTesterPctComplete((pcts) => {
      const { appPct, serverPct, tlsPct } = pcts;
      
      const colourOfDonut = (pct) => {
        let colourToSet;
        if (pct < 0.2) colourToSet = 'red';
        else if (pct >= 0.2 && pct < 0.7) colourToSet = 'magenta';
        else if (pct >= 0.7) colourToSet = 'blue';
        return colourToSet;
      };
      
      internals.donut.app.instance.setData([
        { percent: parseFloat((appPct + 0.00) % 1).toFixed(2), label: 'app', color: colourOfDonut(appPct) },
        { percent: parseFloat((serverPct + 0.00) % 1).toFixed(2), label: 'server', color: colourOfDonut(serverPct) },
        { percent: parseFloat((tlsPct + 0.00) % 1).toFixed(2), label: 'tls', color: colourOfDonut(tlsPct) }
      ]);
    });

    scrn.on('resize', () => {
      internals.donut.app.instance.emit('attach');
      internals.logTail.app.instance.emit('attach');
    });
    subscribeToTesterProgress(internals.logTail.app.instance);
  };

  const page2 = (scrn) => {
    const serverGrid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    internals.logTail.server.instance = serverGrid.set(
      internals.logTail.server.gridCoords.row,
      internals.logTail.server.gridCoords.col,
      internals.logTail.server.gridCoords.rowSpan,
      internals.logTail.server.gridCoords.colSpan,
      internals.logTail.server.type,
      internals.logTail.server.args
    );

    subscribeToTesterProgress(internals.logTail.server.instance);
  };

  const page3 = (scrn) => {
    const tlsGrid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    internals.logTail.tls.instance = tlsGrid.set(
      internals.logTail.tls.gridCoords.row,
      internals.logTail.tls.gridCoords.col,
      internals.logTail.tls.gridCoords.rowSpan,
      internals.logTail.tls.gridCoords.colSpan,
      internals.logTail.tls.type,
      internals.logTail.tls.args
    );

    subscribeToTesterProgress(internals.logTail.tls.instance);
  };

  screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0));

  const carousel = new contrib.carousel([page1, page2, page3], { screen, interval: 0, controlKeys: true }); // eslint-disable-line new-cap
  carousel.start();
};


const initTPCarousel = (receiveTestPlan) => {
  const screen = blessed.screen({
    dump: `${process.cwd()}/logs/dashboard/log.log`,
    smartCSR: true,
    autoPadding: false,
    warnings: true,
    title: projectName
  });
  const page1 = (scrn) => {
    const appGrid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    internals.logScroll.app.instance = appGrid.set(
      internals.logScroll.app.gridCoords.row,
      internals.logScroll.app.gridCoords.col,
      internals.logScroll.app.gridCoords.rowSpan,
      internals.logScroll.app.gridCoords.colSpan,
      internals.logScroll.app.type,
      internals.logScroll.app.args
    );

    receiveTestPlan(internals.logScroll.app.instance);
  };

  const page2 = (scrn) => {
    const serverGrid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    internals.logScroll.server.instance = serverGrid.set(
      internals.logScroll.server.gridCoords.row,
      internals.logScroll.server.gridCoords.col,
      internals.logScroll.server.gridCoords.rowSpan,
      internals.logScroll.server.gridCoords.colSpan,
      internals.logScroll.server.type,
      internals.logScroll.server.args
    );

    receiveTestPlan(internals.logScroll.server.instance);
  };

  const page3 = (scrn) => {
    const tlsGrid = new contrib.grid({ rows: 12, cols: 12, screen: scrn }); // eslint-disable-line new-cap

    internals.logScroll.tls.instance = tlsGrid.set(
      internals.logScroll.tls.gridCoords.row,
      internals.logScroll.tls.gridCoords.col,
      internals.logScroll.tls.gridCoords.rowSpan,
      internals.logScroll.tls.gridCoords.colSpan,
      internals.logScroll.tls.type,
      internals.logScroll.tls.args
    );

    receiveTestPlan(internals.logScroll.tls.instance);
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
