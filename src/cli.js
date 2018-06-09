'use strict'
debugger;
const sywac = require('sywac');
const chalk = require('chalk');
const figlet = require('figlet');




let argv;



const processCommands = async (options) => {
  const cliArgsSuccessfullyHandled = true;
  if (!argv) argv = options.argv
  if (argv.length < 3 || argv[2] === 'screen') return;
  debugger;
  //const args = yargs.parse(argv);



  const cliArgs = await sywac
  .usage(`Usage: $0 [command] [option(s)]`)
  .commandDirectory('cmds')
  // This overrides the --help and --version and adds their aliases
  .showHelpByDefault()
  .boolean('-a, --about', {desc: 'Show about screen'})
  .version('-v, --version', {desc: 'Show version number'})
  .help('-h, --help')
  .preface(figlet.textSync('purpleteam', 'Chunky'), chalk.bgHex('#9961ed')('Find & fix your security defects  before someone exploits them'))
  .epilogue('For more informatiion, find the manual at https://docs.purpleteam-labs.com')
  .style({
    //usagePrefix: str => chalk.hex('#9961ed').bold(str),
    flags: str => chalk.bold(str),
    group: str => chalk.hex('#9961ed').bold(str),
    messages: str => chalk.keyword('orange').bold(str)
  })
  .parseAndExit()

  debugger;





  if (!cliArgs.handled) {
    console.log('No commands were run.');
    return !cliArgsSuccessfullyHandled;
  }
  return cliArgsSuccessfullyHandled;
    

};








module.exports = {

  
  processCommands

};
