
exports.command = 'testplan';
exports.desc = 'Retrieve the test plan that will be executed.';
exports.builder = {};
exports.handler = (parsedArgv) => {
  if (!parsedArgv._handled) console.log('testplan handler:', parsedArgv)
  debugger;
  parsedArgv._handled = true;

  // Todo: KC: Get the testplan.
};

