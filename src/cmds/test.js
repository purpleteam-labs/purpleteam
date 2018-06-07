
exports.command = 'test';
exports.description = 'Launch purpleteam to attack your specified target';
exports.builder = (yargs) => {
  debugger;
  yargs.option('c', {alias: 'config-file', demandOption: true, describe: 'Build user supplied configuration file.', type: 'string', requiresArg: true}).strict();
};
exports.handler = (parsedArgv) => {
  debugger;
  // Todo: KC: use a .coerce() and get the file.
  console.log('Ok, so test is running');
  parsedArgv._handled = true;
  // Todo: KC: Start the testing.
};

