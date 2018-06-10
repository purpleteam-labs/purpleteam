
exports.flags = 'testplan';
exports.desc = 'Retrieve the test plan that will be execute when you run test.';
exports.setup = (sywac) => {
  sywac.usage({ optionsPlaceholder: '' });
};
exports.run = (parsedArgv, context) => {
  const argv = parsedArgv;

  if (parsedArgv._.length) {
    context.cliMessage('To many arguments provided, testplan requires 0 additional arguments.');
  } else {
    console.log('Executing retrieval of testplan...'); // eslint-disable-line no-console
  }

  argv.handled = true;

  // Todo: KC: Get the testplan.
};
