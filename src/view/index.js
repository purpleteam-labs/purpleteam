// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import config from '../../config/config.js';

const viewFileName = `./${config.get('uI')}.js`;

const { default: view } = await import(viewFileName);

export default view;
