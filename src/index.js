const config = require('config/config');
const log = require('purpleteam-logger').init(config.get('logger'));

const { processCommands } = require('src/cli');

exports.start = async (options) => {
  log.debug('Starting the CLI', { tags: ['index'] });
  await processCommands({ argv: options.argv });  
};
