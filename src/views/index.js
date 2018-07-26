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
    //   gb: 'default',
    //   border: {
    //     fg: 'magenta',
    //     bg: 'default'
    //   }
    // },
    border: {
      type: 'line',
      fg: '#00ff00'
    },
  },
  instance: undefined
};

module.exports = {
  testerViews: [app, server, tls],
  testerPctComplete,
  statTable
};
