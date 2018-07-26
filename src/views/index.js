const contrib = require('blessed-contrib');
const app = require('./app');
const server = require('./server');
const tls = require('./tls');

const testerPctComplete = {
  gridCoords: {
    row: 10.5,
    col: 0,
    rowSpan: 1.6,
    colSpan: 3
  },
  type: contrib.donut,
  args: {
    label: 'Tester Complete (%)',
    radius: 8,
    arcWidth: 3,
    remainColor: 'black',
    yPadding: 4,
    data: [
      { label: 'app', percent: 0, color: 'red' },
      { label: 'server', percent: 0, color: 'red' },
      { label: 'tls', percent: 0, color: 'red' }
    ],
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
  },
  instance: undefined
};

const statTable = {
  gridCoords: {
    row: 10.5,
    col: 3,
    rowSpan: 1.6,
    colSpan: 3.4
  },
  type: contrib.table,
  args: {
    label: 'Running Statistics',
    keys: true,
    vi: true,
    interactive: true,
    selectedFg: 'white',
    selectedBg: 'blue',
    columnSpacing: 1,
    columnWidth: [10, 14, 12, 10],
    
    // style: {
    //   fg: 'default',
    //   bg: 'default',
    //   border: {
    //     fg: 'magenta',
    //     bg: 'default'
    //   }
    // },
    border: {
      type: 'line',
      fg: 'magenta'
    }
  },
  instance: undefined
};

const newBugs = {
  gridCoords: {
    row: 10.5,
    col: 6.4,
    rowSpan: 1.6,
    colSpan: 1.3
  },
  type: contrib.lcd,
  args: {
    label: 'New Bugs',
    segmentWidth: 0.06,
    segmentInterval: 0.1,
    strokeWidth: 0.9,
    elements: 2,
    display: '02',
    elementSpacing: 4,
    elementPadding: 4,
    color: 'blue',
    style: {
      fg: 'default',
      bg: 'default',
      border: {
        fg: 'magenta',
        bg: 'default'
      }
    },

  },
  instance: undefined
};

const totalProgress = {
  gridCoords: {
    row: 10.5,
    col: 7.7,
    rowSpan: 1.6,
    colSpan: 4.3
  },
  type: contrib.gauge,
  args: {
    label: 'Total Tester Progress',
    percent: 0,
    stroke: 'blue',
    style: {
      fg: 'default',
      bg: 'default',
      border: {
        fg: 'magenta',
        bg: 'default'
      }
    }
    
    

  },
  instance: undefined
};


module.exports = {
  testerViews: [app, server, tls],
  testerPctComplete,
  statTable,
  newBugs,
  totalProgress
};
