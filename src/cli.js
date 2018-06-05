'use strict'

const yargs = require('yargs');

let args;

class Cli {
  constructor(options) {
    args = options.args
  }

  showVersion() {}

  showUsage() {}

  parse(argv) {
    debugger;
    const allArgs = yargs.parse(argv);


  }
  
  runScreen() {

    

  }

}

module.exports = Cli;
