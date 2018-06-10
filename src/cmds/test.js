const readFileAsync = require('util').promisify(require('fs').readFile);

exports.flags = 'test';
exports.description = 'Launch purpleteam to attack your specified target';
exports.setup = (sywac) => {
  sywac.option(
    '-c, --config-file <config-file path>',
    {
      type: 'file', desc: 'Build user supplied configuration file. Must be a file conforming to the schema defined in the purpleteam documentation.', strinct: true, mustExist: true
    }
  );
};
exports.run = async (parsedArgv, context) => {
  const argv = parsedArgv;
  if (parsedArgv.c) {
    // Get the file and validate it.
    let configFileContents;
    try {
      configFileContents = await readFileAsync(parsedArgv.c, { encoding: 'utf8' });
    } catch (err) {
      console.log(`Could not read file: ${parsedArgv.c}, the error was: ${err}`); // eslint-disable-line no-console
    }
    console.log(`We have your file ${parsedArgv.c}`); // eslint-disable-line no-console

    // Todo: KC: deserialise configFileContents
    //    https://github.com/danivek/json-api-serializer looks to be well maintained.
    //    https://github.com/SeyZ/jsonapi-serializer     looks to be a little neglected.

    // Todo: KC: Validate object graph using Joi. Look at using the same validation in the Orchestrator as well.

    // Todo: KC: Start the testing.
    console.log('Ok, so test is running'); // eslint-disable-line no-console
  } else {
    context.cliMessage('You must provide a valid build user configuration file that exists on the local file system.');
  }

  argv.handled = true;
};
