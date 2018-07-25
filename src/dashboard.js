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
        // if (pct < 0.2) colourToSet = 'red';
        // else if (pct >= 0.2 && pct < 0.7) colourToSet = 'magenta';
        // else if (pct >= 0.7) colourToSet = 'blue';

        const colours = [[255,0,0], [255,0,5], [255,0,10], [255,0,15], [255,0,20], [255,0,25], [255,0,30], [255,0,35], [255,0,40], [255,0,45], [255,0,51], [255,0,56], [255,0,61], [255,0,66], [255,0,71], [255,0,76], [255,0,81], [255,0,86], [255,0,91], [255,0,96], [255,0,102], [255,0,107], [255,0,112], [255,0,117], [255,0,122], [255,0,127], [255,0,132], [255,0,137], [255,0,142], [255,0,147], [255,0,153], [255,0,158], [255,0,163], [255,0,168], [255,0,173], [255,0,178], [255,0,183], [255,0,188], [255,0,193], [255,0,198], [255,0,204], [255,0,209], [255,0,214], [255,0,219], [255,0,224], [255,0,229], [255,0,234], [255,0,239], [255,0,244], [255,0,249], [255,0,255], [249,0,255], [244,0,255], [239,0,255], [234,0,255], [229,0,255], [224,0,255], [219,0,255], [214,0,255], [209,0,255], [204,0,255], [198,0,255], [193,0,255], [188,0,255], [183,0,255], [178,0,255], [173,0,255], [168,0,255], [163,0,255], [158,0,255], [153,0,255], [147,0,255], [142,0,255], [137,0,255], [132,0,255], [127,0,255], [122,0,255], [117,0,255], [112,0,255], [107,0,255], [102,0,255], [96,0,255], [91,0,255], [86,0,255], [81,0,255], [76,0,255], [71,0,255], [66,0,255], [61,0,255], [56,0,255], [51,0,255], [45,0,255], [40,0,255], [35,0,255], [30,0,255], [25,0,255], [20,0,255], [15,0,255], [10,0,255], [5,0.255], [0,0,255]];

        const formattedPct = parseInt(parseFloat(pct).toFixed(2).split('.')[1]);

        return colours[formattedPct];
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
