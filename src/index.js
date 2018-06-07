'use strict';


debugger;
const { processCommands } = require('src/cli');
const { runScreen }  = require('src/screen');

exports.start = async function (options) {
  
  
  debugger;
  if (!processCommands({argv: options.argv})) runScreen();
  debugger;


};
