const contrib = require('blessed-contrib');

const app = require('./app');
const server = require('./server');
const tls = require('./tls');

const testerViewTypes = [app, server, tls];

const testerPctCompleteType = {
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
    data: testerViewTypes.map(tv => ({ label: tv.testOpts.args.name, percent: 0, color: 'red' })),
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
  }
};

const statTableType = {
  gridCoords: {
    row: 10.5,
    col: 3,
    rowSpan: 1.6,
    colSpan: 4.0
  },
  type: contrib.table,
  args: {
    label: 'Running Statistics',
    keys: true,
    vi: true,
    interactive: true,
    selectedFg: 'white',
    selectedBg: 'magenta',
    columnSpacing: 1,
    columnWidth: [10, 12, 12, 6, 12],
    fg: 'magenta',
    style: {
      fg: 'blue',
      bg: 'default',
      border: {
        fg: 'magenta',
        bg: 'default'
      }
    }
  },
  headers: ['Testers', 'SessionId', 'Threshold', 'Bugs', 'Complete (%)'],
  seedData: testerViewTypes.map(tv => [tv.testOpts.args.name, '-', 0, 0, 0])
};

const newBugsType = {
  gridCoords: {
    row: 10.5,
    col: 7.0,
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
    display: '00',
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
    }
  }
};

const totalProgressType = {
  gridCoords: {
    row: 10.5,
    col: 8.3,
    rowSpan: 1.6,
    colSpan: 3.7
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
  }
};


module.exports = {
  testerViewTypes, // [app, server, tls],
  testerPctCompleteType,
  statTableType,
  newBugsType,
  totalProgressType
};
