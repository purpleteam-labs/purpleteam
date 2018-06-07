'use strict';
require('app-module-path/register');


const { processCommands } = require('./cli');
const { runScreen }  = require('./screen');

exports.start = async function (options) {
  
  
  debugger;
  if (!processCommands({argv: options.argv})) runScreen();
  debugger;


};
