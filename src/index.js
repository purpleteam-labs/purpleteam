const config = require('config/config');
const log = require('purpleteam-logger').init(config.get('logger'));

const { processCommands } = require('src/cli');
const { runScreen } = require('src/screen');

exports.start = async (options) => {
  if (!await processCommands({ argv: options.argv })) runScreen();
};
