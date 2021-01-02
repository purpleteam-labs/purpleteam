// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of purpleteam.

// purpleteam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// purpleteam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with purpleteam. If not, see <https://www.gnu.org/licenses/>.

const blessed = require('blessed');
const contrib = require('blessed-contrib');

const testOpts = {
  gridCoords: {
    row: 0,
    col: 0,
    rowSpan: 10.5,
    colSpan: 12
  },
  type: contrib.log,
  args: {
    label: 'TLS Tester',
    style: { fg: 'default', bg: 'default', border: { fg: 'magenta', bg: 'default' } },
    bufferLength: 1000,
    tags: 'true',
    name: 'tls'
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
    label: 'TLS Test Plan',
    mouse: true,
    scrollable: true,
    tags: true,
    keys: true,
    vi: true,
    style: { fg: 'default', gb: 'default', border: { fg: 'magenta', bg: 'default' } },
    border: { type: 'line', fg: '#00ff00' },
    hover: { bg: 'blue' },
    scrollbar: { ch: ' ', track: { bg: 'magenta' }, style: { inverse: true } },
    name: 'tls'
  }
};


module.exports = { testOpts, testPlanOpts };
