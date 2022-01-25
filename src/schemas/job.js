// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

import { diffJson } from 'diff';
import ajvErrors from 'ajv-errors';
import addFormats from 'ajv-formats';
import Ajv from 'ajv';
import Bourne from '@hapi/bourne';
import { init as initPtLogger } from 'purpleteam-logger';
import { init as initApiSchema, schema as aPiSchema } from './job.aPi.js';
import { init as initBrowserAppSchema, schema as browserAppSchema } from './job.browserApp.js';

const ajv = new Ajv({ allErrors: true, useDefaults: true, removeAdditional: true });
addFormats(ajv);
ajvErrors(ajv);

const internals = {
  recognisedJobTypes: ['Api', 'BrowserApp'],
  config: {
    sut: null,
    job: null
  },
  log: null,
  validateApi: null,
  validateBrowserApp: null
};

const convertJsonToObj = (value) => ((typeof value === 'string' || value instanceof String) ? Bourne.parse(value) : value);
const deltaLogs = (initialConfig, possiblyMutatedConfig) => {
  const deltas = diffJson(convertJsonToObj(initialConfig), convertJsonToObj(possiblyMutatedConfig));
  const additionLogs = deltas.filter((d) => d.added).map((cV) => `Added -> ${cV.value}`);
  const subtractionsLogs = deltas.filter((d) => d.removed).map((cV) => `Removed -> ${cV.value}`);
  return [...additionLogs, ...subtractionsLogs];
};

const logDeltaLogs = (logItems) => {
  const { log } = internals;
  logItems.length && log.notice(`During Job validation, the following changes were made to the job:\n${logItems}`, { tags: ['job'] });
};

// hapi route.options.validate.payload expects no return value if all good, but a value if mutation occurred.
// eslint-disable-next-line consistent-return
const validateJob = (jobString) => {
  const job = convertJsonToObj(jobString);
  const validate = internals[`validate${job.data.type}`];
  if (!validate) throw new Error(`The Job type supplied is incorrect, please choose one of ${JSON.stringify(internals.recognisedJobTypes, null, 2)}.`);

  if (!validate(job)) {
    const validationError = new Error(JSON.stringify(validate.errors, null, 2));
    validationError.name = 'ValidationError';
    throw validationError;
  }

  const possiblyMutatedJobString = JSON.stringify(job, null, 2);
  const logItems = deltaLogs(jobString, possiblyMutatedJobString);
  logDeltaLogs(logItems);
  return logItems.length ? possiblyMutatedJobString : jobString;
};

const init = ({ loggerConfig, sutConfig, jobConfig }) => {
  internals.config.sut = sutConfig;
  internals.config.job = jobConfig;
  internals.log = initPtLogger(loggerConfig);

  initApiSchema(internals.config);
  initBrowserAppSchema(internals.config);

  internals.validateApi = ajv.compile(aPiSchema);
  internals.validateBrowserApp = ajv.compile(browserAppSchema);

  return { validateJob };
};

export default init;
