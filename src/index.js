'use strict';

// Work out if user passed in a command. If no command, then run the screen.

const Cli = require('./cli');


exports.start = async function (options) {
  
  const cli = new Cli({args: options.args})

  const runScreen = () {
    const screen = require('./screen');
    // Run it...
  };


  if (cli.runScreen) runScreen();



};
