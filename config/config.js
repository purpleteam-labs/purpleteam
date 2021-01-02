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
      url: 'https://set-below'
    }
  },
  purpleteamApi: {
    protocol: {
      doc: 'The protocol of the purpleteam Cloud API. If using local env please use the existing value in the example config, if using cloud env, you will be given this when you sign-up for a purpleteam account.',
      format: ['https', 'http'],
      default: 'https'
    },
    host: {
      doc: 'The IP address of the hostname of the purpleteam cloud API or local orchestrator. If using local env please use the existing value in the example config, if using cloud env, you will be given this when you sign-up for a purpleteam account.',
      format: String,
      default: '240.0.0.0'
    },
    port: {
      doc: 'The port of the purpleteam cloud API or local orchestrator. If using local env please use the existing value, if using cloud env, you will be given this when you sign-up for a purpleteam account.',
      format: 'port',
      default: 2000,
      env: 'PORT'
    },
    url: {
      doc: 'The URL of the purpleteam API.',
      format: 'url',
      default: 'https://set-below'
    },
    stage: {
      doc: 'The API stage of the purpleteam cloud API. If using local env this is not required, if using cloud env, you will be given this when you sign-up for a purpleteam account.',
      format: String,
      default: 'customer to set if using purpleteam in the cloud'
    },
    customerId: {
      doc: 'Your customer id if using purpleteam with the cloud service. If using local env this is not required, if using cloud env, you will be given this when you sign-up for a purpleteam account.',
      format: String,
      default: 'customer to set if using purpleteam in the cloud'
    },
    apiKey: {
      doc: 'Your API key to interact with the purpleteam cloud service. If using local env this is not required, if using cloud env, you will be given this when you sign-up for a purpleteam account.',
      format: String,
      default: 'customer to set if using purpleteam in the cloud',
      env: 'PURPLETEAM_API_KEY',
      sensitive: true
    }
  },
  testerFeedbackComms: {
    medium: {
      doc: 'The messaging medium used for tester[feedback] events. Server Sent Events or Long Polling. See the configuration docs for further details.',
      format: ['sse', 'lp'],
      default: 'sse'
    },
    longPoll: {
      nullProgressMaxRetries: {
        doc: 'The number of times (sequentially receiving an event with a data object containing a property with a null value) to poll the backend when the orchestrator is not receiving feedback from the testers.',
        format: 'int',
        default: 5
      }
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
      default: './testResources/jobs/buildUserConfigFile-AKA-Job'
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
