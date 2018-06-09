'use strict';

const config = require('config/config');
//const log = require('purpleteam-logger').init(config.get('logger'));
// Todo: KC: Setup logging
const { processCommands } = require('src/cli');
const { runScreen }  = require('src/screen');

exports.start = async function (options) {
  
  
  debugger;
  if (! await processCommands({argv: options.argv})) runScreen();
  debugger;


};
