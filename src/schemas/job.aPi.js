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
        type: { type: 'string', enum: ['Api'] },
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
        loggedInIndicator: { type: 'string', minLength: 1 },
        loggedOutIndicator: { type: 'string', minLength: 1 }
      },
      oneOf: [
        { required: ['loggedInIndicator'] },
        { required: ['loggedOutIndicator'] }
      ],
      required: [
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
        emissaryAuthenticationStrategy: { type: 'string', enum: ['MaintainJwt'], default: 'MaintainJwt' },
        route: { type: 'string', pattern: '^/[-?&=\\w/]{1,1000}$' }
      },
      required: [
        'route'
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
        type: { type: 'string', enum: ['tlsScanner', 'appScanner'] },
        id: { type: 'string' }
      },
      required: ['id', 'type'],
      if: { properties: { type: { enum: ['tlsScanner'] } } },
      then: { properties: { id: { type: 'string', pattern: 'NA' } } },
      else: {
        if: { properties: { type: { enum: ['appScanner'] } } },
        then: { properties: { id: { type: 'string', pattern: '^\\w[-\\w]{1,200}$' } } }
      },
      title: 'ResourceLinkage'
    },
    TopLevelResourceObject: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['tlsScanner', 'appScanner'] },
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
            attributes: { $ref: '#/definitions/AttributesObjOfTopLevelResourceObjectOfTypeAppScanner' }
          }
        }
      },
      title: 'TopLevelResourceObject',
      errorMessage: {
        properties: {
          type: 'should be one of either tlsScanner or appScanner',
          id: 'If type is tlsScanner, the id should be NA. If type is appScanner, the id should be a valid appScanner.'
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
        aScannerAttackStrength: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'INSANE'] },
        aScannerAlertThreshold: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        alertThreshold: { type: 'integer', minimum: 0, maximum: 9999 },
        sitesTreePopulationStrategy: { type: 'string', enum: ['ImportUrls', 'OpenApi', 'Soap', 'GraphQl'], default: 'ImportUrls' },
        spiderStrategy: { type: 'string', enum: ['Standard'], default: 'Standard' },
        scannersStrategy: { type: 'string', enum: ['ApiStandard'], default: 'ApiStandard' },
        scanningStrategy: { type: 'string', enum: ['ApiStandard'], default: 'ApiStandard' },
        postScanningStrategy: { type: 'string', enum: ['ApiStandard'], default: 'ApiStandard' },
        reportingStrategy: { type: 'string', enum: ['Standard'], default: 'Standard' },
        openApi: { $ref: '#/definitions/OpenApi' },
        soap: { $ref: '#/definitions/Soap' },
        graphQl: { $ref: '#/definitions/GraphQl' },
        importUrls: { $ref: '#/definitions/ImportUrls' },
        excludedRoutes: {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true,
          minItems: 0
        }
      },
      oneOf: [
        { required: ['openApi'] },
        { required: ['soap'] },
        { required: ['graphQl'] },
        { required: ['importUrls'] }
      ],
      required: ['username'],
      title: 'AttributesObjOfTopLevelResourceObjectOfTypeAppScanner'
    },

    OpenApi: {
      type: 'object',
      additionalProperties: false,
      properties: {
        importFileContentBase64: { type: 'string', pattern: '^(?:[A-Za-z\\d+/]{4})*(?:[A-Za-z\\d+/]{3}=|[A-Za-z\\d+/]{2}==)?$' }, // https://regexland.com/base64/
        importUrl: { type: 'string', format: 'uri' }
      },
      oneOf: [
        { required: ['importFileContentBase64'] },
        { required: ['importUrl'] }
      ],
      required: [],
      title: 'OpenApi'
    },

    Soap: {
      type: 'object',
      additionalProperties: false,
      properties: {
        importFileContentBase64: { type: 'string', pattern: '^(?:[A-Za-z\\d+/]{4})*(?:[A-Za-z\\d+/]{3}=|[A-Za-z\\d+/]{2}==)?$' }, // https://regexland.com/base64/
        importUrl: { type: 'string', format: 'uri' }
      },
      oneOf: [
        { required: ['importFileContentBase64'] },
        { required: ['importUrl'] }
      ],
      required: [],
      title: 'Soap'
    },

    GraphQl: {
      type: 'object',
      additionalProperties: false,
      properties: {
        importFileContentBase64: { type: 'string', pattern: '^(?:[A-Za-z\\d+/]{4})*(?:[A-Za-z\\d+/]{3}=|[A-Za-z\\d+/]{2}==)?$' }, // https://regexland.com/base64/
        importUrl: { type: 'string', format: 'uri' },
        // If the following are not set, then no changes to Zaproxy defaults are made.
        maxQueryDepth: { type: 'integer', minimum: 0, maximum: 100 }, // Zaproxy default: 5
        maxArgsDepth: { type: 'integer', minimum: 0, maximum: 100 }, // Zaproxy default: 5
        optionalArgsEnabled: { type: 'boolean' }, // Zaproxy default: true
        argsType: { type: 'string', enum: ['INLINE', 'VARIABLES', 'BOTH'] }, // Zaproxy default: 'BOTH'
        querySplitType: { type: 'string', enum: ['LEAF', 'ROOT_FIELD', 'OPERATION'] }, // Zaproxy default: 'LEAF'
        requestMethod: { type: 'string', enum: ['POST_JSON', 'POST_GRAPHQL', 'GET'] } // Zaproxy default: 'POST_JSON'
      },
      oneOf: [
        { required: ['importFileContentBase64'] },
        { required: ['importUrl'] }
      ],
      required: [],
      title: 'GraphQl'
    },

    ImportUrls: {
      type: 'object',
      additionalProperties: false,
      properties: { importFileContentBase64: { type: 'string', pattern: '^(?:[A-Za-z\\d+/]{4})*(?:[A-Za-z\\d+/]{3}=|[A-Za-z\\d+/]{2}==)?$' } }, // https://regexland.com/base64/
      required: ['importFileContentBase64'],
      title: 'ImportUrls'
    }
  }
};

module.exports = { init, schema };
