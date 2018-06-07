//const yargs = require('yargs');
const pkg = require(`${process.cwd()}/package.json`);

const internals = {};

exports.command = '$0';
exports.desc = 'Default command (shows the interactive screen).';
exports.builder = (yargs) => {

  internals.yargs = yargs;
  debugger;
  //return yargs;

};
exports.handler = (parsedArgv) => {
  debugger;
  parsedArgv._handled = true;      
  if (parsedArgv.a) {
    const { name: projectName, version, description, homepage, author: { name, email } } = pkg;
    console.log(`\n${projectName} ${version}`);
    console.log(description);
    console.log(`Homepage: ${homepage}`);
    console.log(`Created by ${name}<${email}>\n`);
  } else {
    // Add commands so they show up in help.

//    yargs.command()



  internals.yargs.command(require('./screen')).command(require('./testplan')).command(require('./test'));


debugger;
    internals.yargs.showHelp();
    console.log(`Unknown argument: ${parsedArgv._[0]}`);
  }
};

