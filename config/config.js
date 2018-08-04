const convict = require('convict');
const path = require('path');

const schema = {
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'production',
    env: 'NODE_ENV'
  },
  logger: {
    level: {
      doc: 'Write all log events with this level and below. Syslog levels used: https://github.com/winstonjs/winston#logging-levels',
      format: ['emerg', 'alert', 'crit', 'error', 'warning', 'notice', 'info', 'debug'],
      default: 'notice'
    },
    transports: {
      doc: 'Transports to send logging events to.',
      format: Array,
      default: ['SignaleTransport']
    }
  },
  purpleteamApi: {
    protocol: {
      doc: 'The protocol of the purpleteam SaaS.',
      format: ['https', 'http'],
      default: 'https'
    },
    ip: {
      doc: 'The IP address of the purpleteam SaaS.',
      format: 'ipaddress',
      default: '240.0.0.0'
    },
    port: {
      doc: 'The port of the purpleteam SaaS.',
      format: 'port',
      default: 2000,
      env: 'PORT'
    },
    url: {
      doc: 'The URL of the purpleteam API',
      formate: 'url',
      default: 'not yet set'
    }
  },
  results: {
    uri: {
      doc: 'The location of the results.',
      format: String,
      default: `${process.cwd()}/outcomes/results.txt`
    }
  }
};

const config = convict(schema);
config.loadFile(path.join(__dirname, `config.${process.env.NODE_ENV}.json`));
config.validate();

config.set('purpleteamApi.url', `${config.get('purpleteamApi.protocol')}://${config.get('purpleteamApi.ip')}:${config.get('purpleteamApi.port')}`);

module.exports = config;
