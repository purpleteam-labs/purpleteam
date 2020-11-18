const convict = require('convict');
const convictFormatWithValidator = require('convict-format-with-validator');
const path = require('path');

convict.addFormats(convictFormatWithValidator);

const schema = {
  env: {
    doc: 'The application environment.',
    format: ['cloud', 'local', 'test'],
    default: 'cloud',
    env: 'NODE_ENV'
  },
  loggers: {
    def: {
      level: {
        doc: 'Default logger to write all log events with this level and below. Syslog levels used: https://github.com/winstonjs/winston#logging-levels',
        format: ['emerg', 'alert', 'crit', 'error', 'warning', 'notice', 'info', 'debug'],
        default: 'notice'
      },
      transports: {
        doc: 'Transports to send generic logging events to.',
        format: Array,
        default: ['SignaleTransport']
      }
    },
    testerProgress: {
      transports: {
        doc: 'Transports to send testerProgress events to.',
        format: Array,
        default: ['File']
      },
      dirname: {
        doc: 'Location of testerProgress logs.',
        format: String,
        default: `${process.cwd()}/logs/`
      }
    }
  },
  purpleteamAuth: {
    protocol: {
      doc: 'The protocol of the purpleteam authorisation server.',
      format: ['https', 'http'],
      default: 'https'
    },
    host: {
      doc: 'The IP address or hostname of the purpleteam authorisation server.',
      format: String,
      default: 'purpleteam'
    },
    appClientId: {
      doc: 'The App Client Id used to authenticate to the purpleteam authorisation server.',
      format: String,
      default: 'customer to set if using purpleteam in the cloud',
      env: 'PURPLETEAM_APP_CLIENT_ID',
      sensitive: true
    },
    appClientSecret: {
      doc: 'The App Client Secret used to authenticate to the purpleteam authorisation server.',
      format: String,
      default: 'customer to set if using purpleteam in the cloud',
      env: 'PURPLETEAM_APP_CLIENT_SECRET',
      sensitive: true
    },
    custnSubdomain: {
      doc: 'The customer specific subdomain.',
      format: String,
      default: 'custn'
    },
    url: {
      doc: 'The URL of the purpleteam authorisation server.',
      format: 'url',
      url: 'https://set-me'
    }
  },
  purpleteamApi: {
    protocol: {
      doc: 'The protocol of the purpleteam Cloud API.',
      format: ['https', 'http'],
      default: 'https'
    },
    host: {
      doc: 'The IP address or hostname of the purpleteam Cloud API.',
      format: String,
      default: '240.0.0.0'
    },
    port: {
      doc: 'The port of the purpleteam Cloud API or Local orchestrator.',
      format: 'port',
      default: 2000,
      env: 'PORT'
    },
    url: {
      doc: 'The URL of the purpleteam API.',
      format: 'url',
      default: 'https://set-me'
    },
    stage: {
      doc: 'The API stage of the purpleteam Cloud API, only used in the cloud.',
      format: String,
      default: 'customer to set if using purpleteam in the cloud'
    },
    customerId: {
      doc: 'Your customer id if using purpleteam with the Cloud service.',
      format: String,
      default: 'customer to set if using purpleteam in the cloud'
    },
    apiKey: {
      doc: 'Your API key to interact with the purpleteam Cloud service.',
      format: String,
      default: 'customer to set if using purpleteam in the cloud',
      env: 'PURPLETEAM_API_KEY',
      sensitive: true
    }
  },
  outcomes: {
    dir: {
      doc: 'The location of the results.',
      format: String,
      default: `${process.cwd()}/outcomes/`
    },
    fileName: {
      doc: 'The name of the archive file containing all of the Tester outcomes (results, reports).',
      format: String,
      default: 'outcomes_time.zip'
    },
    filePath: {
      doc: 'The full file path of the archive file containing all of the Tester outcomes (results, reports).',
      format: String,
      default: 'not yet set'
    }
  },
  buildUserConfig: {
    fileUri: {
      doc: 'The location of the build user config file.',
      format: String,
      default: '/testing/buildUserConfigFile'
    }
  },
  modulePaths: {
    blessed: {
      doc: 'The path to blessed module.',
      format: String,
      default: 'blessed'
    }
  }
};

const config = convict(schema);
// If you would like to put your sensitive values in a different location and lock down access,
//   simply provide the isolated file path as an array element to config.loadFile.
// Doc: https://github.com/mozilla/node-convict/tree/master/packages/convict#configloadfilefile-or-filearray
// config.loadFile([path.join(__dirname, `config.${process.env.NODE_ENV}.json`), '/my/locked/down/purpleteam_secrets.json']);
config.loadFile(path.join(__dirname, `config.${process.env.NODE_ENV}.json`));
config.validate();

config.set('purpleteamApi.url', `${config.get('purpleteamApi.protocol')}://${config.get('purpleteamApi.host')}:${config.get('purpleteamApi.port')}`);
config.set('outcomes.filePath', `${config.get('outcomes.dir')}${config.get('outcomes.fileName')}`);
config.set('purpleteamAuth.url', `${config.get('purpleteamAuth.protocol')}://${config.get('purpleteamAuth.custnSubdomain')}.${config.get('purpleteamAuth.host')}/oauth2/token`);

module.exports = config;
