// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

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
