// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import blessed from 'blessed';
import contrib from 'blessed-contrib';

const testOpts = {
  gridCoords: {
    row: 0,
    col: 0,
    rowSpan: 10.5,
    colSpan: 12
  },
  type: contrib.log,
  args: {
    label: 'Server Tester',
    style: { fg: 'default', bg: 'default', border: { fg: 'magenta', bg: 'default' } },
    bufferLength: 1000,
    tags: 'true',
    name: 'server'
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
    label: 'Server Test Plan',
    mouse: true,
    scrollable: true,
    tags: true,
    keys: true,
    vi: true,
    style: { fg: 'default', bg: 'default', border: { fg: 'magenta', bg: 'default' } },
    border: { type: 'line', fg: '#00ff00' },
    hover: { bg: 'blue' },
    scrollbar: { ch: ' ', track: { bg: 'magenta' }, style: { inverse: true } },
    name: 'server'
  }
};

export default { testOpts, testPlanOpts };

