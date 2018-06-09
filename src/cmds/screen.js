//const yargs = require('yargs');
const pkg = require(`${process.cwd()}/package.json`);

const internals = {};

exports.flags = '*';
exports.desc = 'Default command (shows the interactive screen).';
exports.setup = (sywac) => {

  internals.sywac = sywac;
  debugger;
  //return yargs;

};
exports.run = (parsedArgv, context) => {
  debugger;
  parsedArgv.handled = true;  

  console.log('in default command run.......')

  if (parsedArgv.about) {
    const { name: projectName, version, description, homepage, author: { name, email } } = pkg;
    console.log(`\n${projectName} ${version}`);
    console.log(description);
    console.log(`Homepage: ${homepage}`);
    console.log(`Created by ${name}<${email}>\n`);
  } else {
    // Add commands so they show up in help.
debugger;
    //console.log(`Unknown argument: ${parsedArgv._[0]}`);
    return context.cliMessage(`Unknown argument: ${context.args}`);



  //internals.sywac.command(require('./screen')).command(require('./testplan')).command(require('./test'));


debugger;
    //internals.sywac.showHelp();
    //console.log(`Unknown argument: ${parsedArgv._[0]}`);
  }
};

