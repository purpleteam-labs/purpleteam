// Copyright (C) 2017-2021 BinaryMist Limited. All rights reserved.

// This file is part of PurpleTeam.

// PurpleTeam is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation version 3.

// PurpleTeam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this PurpleTeam project. If not, see <https://www.gnu.org/licenses/>.

const jsdiff = require('diff');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const Bourne = require('@hapi/bourne');

const ajv = new Ajv({ allErrors: true, useDefaults: true, removeAdditional: true });
addFormats(ajv);

// Todo: KC: Make error messages more meaningful.
require('ajv-errors')(ajv);
const purpleteamLogger = require('purpleteam-logger');

const internals = {
  config: {
    sut: null,
    job: null
  },
  log: null,
  validate: null
};

// Used quicktype to generate initial schema from job
const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $ref: '#/definitions/Job',
  definitions: {
    Job: {
      type: 'object',
      additionalProperties: false,
      properties: {
        data: { $ref: '#/definitions/Data' },
        included: {
          type: 'array',
          items: { $ref: '#/definitions/TopLevelResourceObject' }
        }
      },
      required: [
        'data',
        'included'
      ],
      title: 'Job'
    },
    Data: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['job'] },
        attributes: { $ref: '#/definitions/DataAttributes' },
        relationships: { $ref: '#/definitions/Relationships' }
      },
      required: [
        'attributes',
        'relationships',
        'type'
      ],
      title: 'Data'
    },
    DataAttributes: {
      type: 'object',
      additionalProperties: false,
      properties: {
        version: { type: 'string', get const() { return internals.config.job.version; } },
        sutAuthentication: { $ref: '#/definitions/SutAuthentication' },
        sutIp: { type: 'string', oneOf: [{ format: 'ipv6' }, { format: 'hostname' }] },
        sutPort: { type: 'integer', minimum: 1, maximum: 65535 },
        sutProtocol: { type: 'string', enum: ['https', 'http'], default: 'https' },
        browser: { type: 'string', get enum() { return internals.config.sut.browserOptions; }, get default() { return internals.config.sut.defaultBrowser; } },
        loggedInIndicator: { type: 'string', minLength: 1 }
      },
      required: [
        'browser',
        'loggedInIndicator',
        'sutAuthentication',
        'sutIp',
        'sutPort',
        'sutProtocol',
        'version'
      ],
      title: 'DataAttributes',
      errorMessage: { properties: { loggedInIndicator: 'A loggedInIndicator is required by the App emissary in order to know if a login was successful' } }
    },
    SutAuthentication: {
      type: 'object',
      additionalProperties: false,
      properties: {
        route: { type: 'string', pattern: '^/[-\\w/]{1,200}$' },
        usernameFieldLocater: { type: 'string', pattern: '^[a-zA-Z0-9_.-]{1,100}$' }, // Possibly allow spaces for css selectors.
        passwordFieldLocater: { type: 'string', pattern: '^[a-zA-Z0-9_.-]{1,100}$' }, // Possibly allow spaces for css selectors.
        submit: { type: 'string', pattern: '^[a-zA-Z0-9_\\-\\s]{1,100}$' },
        expectedPageSourceSuccess: { type: 'string', minLength: 2, maxLength: 200 }
      },
      required: [
        'passwordFieldLocater',
        'route',
        'submit',
        'usernameFieldLocater',
        'expectedPageSourceSuccess'
      ],
      title: 'SutAuthentication'
    },
    Relationships: {
      type: 'object',
      additionalProperties: false,
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/definitions/ResourceLinkage' }
        }
      },
      required: [
        'data'
      ],
      title: 'Relationships'
    },
    ResourceLinkage: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['tlsScanner', 'appScanner', 'route'] },
        id: { type: 'string' }
      },
      required: ['id', 'type'],
      if: { properties: { type: { enum: ['tlsScanner'] } } },
      then: { properties: { id: { type: 'string', pattern: 'NA' } } },
      else: {
        if: { properties: { type: { enum: ['appScanner'] } } },
        then: { properties: { id: { type: 'string', pattern: '^\\w[-\\w]{1,200}$' } } },
        else: {
          if: { properties: { type: { enum: ['route'] } } },
          then: { properties: { id: { type: 'string', pattern: '^/[-\\w/]{1,200}$' } } }
        }
      },
      title: 'ResourceLinkage'
    },
    TopLevelResourceObject: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['tlsScanner', 'appScanner', 'route'] },
        id: { type: 'string' },
        attributes: {},
        relationships: {}
      },
      required: [
        'attributes',
        'id',
        'type'
      ],
      if: { properties: { type: { enum: ['tlsScanner'] } } },
      then: {
        properties: {
          id: { type: 'string', pattern: 'NA' },
          attributes: { $ref: '#/definitions/AttributesObjOfTopLevelResourceObjectOfTypeTlsScanner' }
        }
      },
      // If we want to use flags for regex, etc, then need to use ajv-keywords: https://github.com/epoberezkin/ajv-keywords#regexp
      else: {
        if: { properties: { type: { enum: ['appScanner'] } } },
        then: {
          properties: {
            id: { type: 'string', pattern: '^\\w[-\\w]{1,200}$' },
            attributes: { $ref: '#/definitions/AttributesObjOfTopLevelResourceObjectOfTypeAppScanner' },
            relationships: { $ref: '#/definitions/Relationships' }
          },
          required: ['relationships']
        },
        else: {
          if: { properties: { type: { enum: ['route'] } } },
          then: {
            properties: {
              id: { type: 'string', pattern: '^/[-\\w/]{1,200}$' },
              attributes: { $ref: '#/definitions/AttributesObjOfTopLevelResourceObjectOfTypeRoute' }
            }
          }
        }
      },
      title: 'TopLevelResourceObject',
      errorMessage: {
        properties: {
          type: 'should be one of either tlsScanner, appScanner, or route',
          id: 'If type is tlsScanner, the id should be NA. If type is appScanner, the id should be a valid appScanner. If type is route, the id should be a valid route.'
        }
      }
    },

    AttributesObjOfTopLevelResourceObjectOfTypeTlsScanner: {
      type: 'object',
      additionalProperties: false,
      properties: {
        tlsScannerSeverity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        alertThreshold: { type: 'integer', minimum: 0, maximum: 1000 }
      },
      required: [],
      title: 'AttributesObjOfTopLevelResourceObjectOfTypeTlsScanner'
    },

    AttributesObjOfTopLevelResourceObjectOfTypeAppScanner: {
      type: 'object',
      additionalProperties: false,
      properties: {
        username: { type: 'string', pattern: '^([a-zA-Z0-9_-]{1,100}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z0-9]{2,})$' }, // https://www.py4u.net/discuss/1646374
        password: { type: 'string' },
        aScannerAttackStrength: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'INSANE'] },
        aScannerAlertThreshold: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        alertThreshold: { type: 'integer', minimum: 0, maximum: 1000 }
      },
      required: [],
      title: 'AttributesObjOfTopLevelResourceObjectOfTypeAppScanner'
    },

    AttributesObjOfTopLevelResourceObjectOfTypeRoute: {
      type: 'object',
      additionalProperties: false,
      properties: {
        attackFields: {
          type: 'array',
          items: { $ref: '#/definitions/AttackField' },
          uniqueItems: true,
          minItems: 0
        },
        method: { type: 'string', enum: ['GET', 'PUT', 'POST'] },
        submit: { type: 'string', pattern: '^[a-zA-Z0-9_\\-\\s]{1,100}$' }
      },
      required: ['attackFields', 'method', 'submit'],
      title: 'AttributesObjOfTopLevelResourceObjectOfTypeRoute'
    },

    AttackField: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', pattern: '^[a-zA-Z0-9_\\-]{1,100}$' },
        value: { type: 'string' },
        visible: { type: 'boolean' } // Todo: KC: Need to check whether visible should be required.
      },
      required: [
        'name',
        'value'
      ],
      title: 'AttackField'
    }
  }
};

const convertJsonToObj = (value) => ((typeof value === 'string' || value instanceof String) ? Bourne.parse(value) : value);
const deltaLogs = (initialConfig, possiblyMutatedConfig) => {
  const deltas = jsdiff.diffJson(convertJsonToObj(initialConfig), convertJsonToObj(possiblyMutatedConfig));
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
  const { validate } = internals;
  const job = convertJsonToObj(jobString);

  // Todo: Kim C: Will need to test various configs.
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
  internals.log = purpleteamLogger.init(loggerConfig);
  internals.validate = ajv.compile(schema);
  return { validateJob };
};

module.exports = { init };
