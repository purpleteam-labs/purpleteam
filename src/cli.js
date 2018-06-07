'use strict'
debugger;
const yargs = require('yargs');
const yargonaut = require('yargonaut').style('magenta.bold', ['Commands:', 'Options:', 'Usage:']);
const chalk = yargonaut.chalk();




let argv;



const processCommands = (options) => {
  const cliArgsSuccessfullyHandled = true;
  if (!argv) argv = options.argv
  if (argv.length < 3 || argv[2] === 'screen') return;
  debugger;
  //const args = yargs.parse(argv);



  const cliArgs = yargs
  .usage(`Usage: $0 [command] [option(s)]`)
  .commandDir('cmds')
  // This overrides the --help and --version and adds their aliases  
  .options({ 
    'h': {alias: 'help', describe: 'Show help'},
    'v': {alias: 'version', describe: 'Show version number', type: ''},
    'a': {alias: 'about', describe: 'Show about screen', type: ''},
  })
  .strict()
  .epilogue('For more informatiion, find the manual at https://docs.purpleteam-labs.com')
  .argv;
  debugger;



  if (!cliArgs._handled) {
    console.log('outer:', argv);
    return !cliArgsSuccessfullyHandled;
  }
  return cliArgsSuccessfullyHandled;
    

};








module.exports = {

  
  processCommands

};
