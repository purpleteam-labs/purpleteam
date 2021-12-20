// Copyright (C) 2017-2022 BinaryMist Limited. All rights reserved.

// Use of this software is governed by the Business Source License
// included in the file /licenses/bsl.md

// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0

const internals = { config: null };

const init = (config) => {
  internals.config = config;
};

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
        type: { type: 'string', enum: ['BrowserApp'] },
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
        loggedInIndicator: { type: 'string', minLength: 1 },
        loggedOutIndicator: { type: 'string', minLength: 1 }
      },
      oneOf: [
        { required: ['loggedInIndicator'] },
        { required: ['loggedOutIndicator'] }
      ],
      required: [
        'browser',
        'sutAuthentication',
        'sutIp',
        'sutPort',
        'sutProtocol',
        'version'
      ],
      title: 'DataAttributes'
    },
    SutAuthentication: {
      type: 'object',
      additionalProperties: false,
      properties: {
        sitesTreeSutAuthenticationPopulationStrategy: { type: 'string', enum: ['FormStandard', 'Link'], default: 'FormStandard' },
        emissaryAuthenticationStrategy: { type: 'string', enum: ['FormStandard', 'ScriptLink'], default: 'FormStandard' },
        route: { type: 'string', pattern: '^/[-?&=\\w/]{1,1000}$' },
        usernameFieldLocater: { type: 'string', pattern: '^[a-zA-Z0-9_. -]{1,100}$' }, // Possibly allow spaces for css selectors.
        passwordFieldLocater: { type: 'string', pattern: '^[a-zA-Z0-9_. -]{1,100}$' }, // Possibly allow spaces for css selectors.
        submit: { type: 'string', pattern: '^[a-zA-Z0-9_\\-\\s]{1,100}$' },
        expectedPageSourceSuccess: { type: 'string', minLength: 2, maxLength: 200 }
      },
      required: [
        'route',
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
        alertThreshold: { type: 'integer', minimum: 0, maximum: 9999 }
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
        alertThreshold: { type: 'integer', minimum: 0, maximum: 9999 },
        sitesTreePopulationStrategy: { type: 'string', enum: ['WebDriverStandard'], default: 'WebDriverStandard' },
        spiderStrategy: { type: 'string', enum: ['Standard'], default: 'Standard' },
        scannersStrategy: { type: 'string', enum: ['BrowserAppStandard'], default: 'BrowserAppStandard' },
        scanningStrategy: { type: 'string', enum: ['BrowserAppStandard'], default: 'BrowserAppStandard' },
        postScanningStrategy: { type: 'string', enum: ['BrowserAppStandard'], default: 'BrowserAppStandard' },
        reportingStrategy: { type: 'string', enum: ['Standard'], default: 'Standard' },
        excludedRoutes: {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true,
          minItems: 0
        }
      },
      required: ['username'],
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
        name: { type: 'string', pattern: '^[a-zA-Z0-9._\\-]{1,100}$' },
        value: {
          anyOf: [
            { type: 'string' },
            { type: 'boolean' },
            { type: 'number' }
          ]
        },
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

module.exports = { init, schema };
