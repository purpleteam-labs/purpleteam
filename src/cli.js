'use strict'

require('yargonaut').style('yellow');
const yargs = require('yargs');
const pkg = require('../package.json');


let argv;

const showVersion = () => {};

const showUsage = () => {};


const processCommands = (options) => {
  const cliArgsSuccessfullyHandled = true;
  if (!argv) argv = options.argv
  if (argv.length < 3) return;
  debugger;
  //const args = yargs.parse(argv);


  const screen = {
    command: '$0',
    desc: 'Default command (shows the interactive screen).',
    builder: (yargs) => {
      //return yargs.strict();
    
    },
    handler: (parsedArgv) => {
      debugger;
      parsedArgv._handled = true;      
      if (parsedArgv.a) {
        const { name: projectName, version, description, author: { name, email } } = pkg;
        console.log(`${projectName} ${version}`);
        console.log(description);
        console.log(`Created by ${name}<${email}>`);
      } else {
        // Add commands so they show up in help.
        yargs.command(screen).command(test).command(testPlan);
        yargs.showHelp();
        console.log(`Unknown argument: ${parsedArgv._[0]}`);
      }
    }
  };

  const testPlan = {
    command: 'testplan',
    desc: 'Retrieve the test plan that will be executed.',
    builder: {},
    handler: (parsedArgv) => {
      if (!parsedArgv._handled) console.log('testplan handler:', parsedArgv)
      debugger;
      parsedArgv._handled = true;
    }
  };

  const test = {
    command: 'test',
    description: 'Launch purpleteam to attack your specified target',
    builder: (yargs) => {
      debugger;
      yargs.option('c', {alias: 'config-file', demandOption: true, describe: 'Build user supplied configuration file.', type: 'string', requiresArg: true}).strict();
    },
    handler: (parsedArgv) => {
      debugger;
      console.log('Ok, so test is running');
      parsedArgv._handled = true;
    }
  };


  const cliArgs = yargs
  .command(screen)
  .command(testPlan)
  .command(test)
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
