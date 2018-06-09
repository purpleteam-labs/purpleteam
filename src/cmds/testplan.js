
exports.flags = 'testplan';
exports.desc = 'Retrieve the test plan that will be execute when you run test.';
exports.setup = (sywac) => {
  debugger;
  sywac.usage({optionsPlaceholder: ''})
};
exports.run = (parsedArgv, context) => {
  debugger;
  if (parsedArgv._.length) {
    context.cliMessage(`To many arguments provided, testplan requires 0 additional arguments.`);
  } else {
    console.log('Executing retrieval of testplan...');  
  }
  
  debugger;
  parsedArgv.handled = true;

  // Todo: KC: Get the testplan.
};

