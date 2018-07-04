const log = require('purpleteam-logger').logger();
const readFileAsync = require('util').promisify(require('fs').readFile);
const request = require('request-promise-native');

exports.flags = 'testplan';
exports.desc = 'Retrieve the test plan that will be execute when you run test.';
exports.setup = (sywac) => {
  // To override the help:
  // sywac.usage({ optionsPlaceholder: '' });
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
      log.error(`Could not read file: ${parsedArgv.c}, the error was: ${err}`, { tags: ['test'] });
      throw err;
    }
    log.notice(`We have your configuration file ${parsedArgv.c}`, { tags: ['testplan'] });
    log.info('Executing retrieval of testplan...', { tags: ['testplan'] });

    await request({
      uri: 'http://127.0.0.1:2000/testplan',
      method: 'POST',
      json: true,
      body: configFileContents,
      headers: { 'Content-Type': 'application/vnd.api+json', Accept: 'text/plain' }
    }).then((testPlan) => {
      log.notice(`Your test plan follows:\n${testPlan}`);
    }).catch((err) => {
      const handle = {
        errorMessageFrame: innerMessage => `Error occured while attempting to retrieve your test plan. Error was: ${innerMessage}`,
        backendTookToLong: '"The purpleteam backend took to long to respond"',
        backendUnreachable: '"The purpleteam backend is currently unreachable".',
        validationError: `Validation of the supplied build user config failed: ${err.error.message}.`,
        syntaxError: `SyntaxError: ${err.error.message}.`,
        unknown: '"Unknown"',
        testPlanFetchFailure: () => {
          if (err.message.includes('socket hang up')) return 'backendTookToLong';
          if (err.message.includes('connect ECONNREFUSED')) return 'backendUnreachable';
          if (err.error.name === 'ValidationError') return 'validationError';
          if (err.error.name === 'SyntaxError') return 'syntaxError';
          return 'unknown';
        }
      };

      log.crit(handle.errorMessageFrame(handle[handle.testPlanFetchFailure()]), { tags: ['testplan'] });
    });
  } else {
    context.cliMessage('You must provide a valid build user configuration file that exists on the local file system.');
  }

  argv.handled = true;
};
