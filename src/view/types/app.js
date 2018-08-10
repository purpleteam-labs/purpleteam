const blessed = require('blessed');
const contrib = require('blessed-contrib');


const testOpts = {
  // Todo: Shouldn't need gridCoords
  gridCoords: {
    row: 0,
    col: 0,
    rowSpan: 10.5,
    colSpan: 12
  },
  type: contrib.log,
  args: {
    label: 'App Tester',
    bufferLength: 1000,
    style: {
      fg: 'default',
      bg: 'default',
      border: {
        fg: 'magenta',
        bg: 'default'
      }
    },    
    tags: 'true',
    name: 'app'
  }
};


const testPlanOpts = {
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
  }
};


module.exports = {
  testOpts,  
  testPlanOpts
};
