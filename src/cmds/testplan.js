const config = require('config/config'); // eslint-disable-line no-unused-vars
const log = require('purpleteam-logger').logger();
const api = require('src/presenter/apiDecoratingAdapter');

api.init(log);

exports.flags = 'testplan';
exports.desc = 'Retrieve the test plan that will be executed when you run test.';
exports.setup = (sywac) => {
  // To override the help:
  // sywac.usage({ optionsPlaceholder: '' });
  sywac.option('-c, --config-file <config-file path>', {
    type: 'file',
    desc: 'Build user supplied configuration file. Must be a file conforming to the schema defined in the purpleteam documentation.',
    mustExist: true,
    defaultValue: config.get('buildUserConfig.fileUri')
  });
};
exports.run = async (parsedArgv, context) => {
  if (parsedArgv.c) {
    const configFileContents = await api.getBuildUserConfigFile(parsedArgv.c);
    await api.getTestPlans(configFileContents);
  } else {
    context.cliMessage('You must provide a valid build user configuration file that exists on the local file system.');
  }
};
