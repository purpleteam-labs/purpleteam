const config = require('config/config');
const log = require('purpleteam-logger').logger();
const readFileAsync = require('util').promisify(require('fs').readFile);
const request = require('request-promise-native');
const api = require('src/apiDecoratingAdapter');

exports.flags = 'testplan';
exports.desc = 'Retrieve the test plan that will be executed when you run test.';
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
    const configFileContents = await api.getBuildUserConfigFile(parsedArgv.c);
    log.info('Executing retrieval of testplan...', { tags: ['testplan'] });
    debugger;
    await api.getTestPlan(configFileContents);
  } else {
    context.cliMessage('You must provide a valid build user configuration file that exists on the local file system.');
  }

  argv.handled = true;
};
