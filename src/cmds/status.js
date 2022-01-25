// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import api from '../presenter/apiDecoratingAdapter.js';

const flags = 'status';
const desc = 'Check the status of the PurpleTeam back-end.';
const run = async () => {
  await api.status();
};

export { flags, desc, run };
