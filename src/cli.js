const sywac = require('sywac');
const chalk = require('chalk');
const figlet = require('figlet');
const pkg = require('package.json');
const log = require('purpleteam-logger').get();

const processCommands = async (options) => { // eslint-disable-line no-unused-vars
  log.debug('Configuring sywac\n', { tags: ['cli'] });
  const api = sywac // eslint-disable-line no-unused-vars
    .usage('Usage: $0 [command] [option(s)]')
    .commandDirectory('cmds')
    // This overrides the --help and --version and adds their aliases
    .showHelpByDefault()
    .version('-v, --version', { desc: 'Show version number' })
    .help('-h, --help')
    .preface(figlet.textSync(pkg.name, 'Chunky'), chalk.bgHex('#9961ed')(pkg.description))
    .epilogue('For more information, find the manual at https://docs.purpleteam-labs.com')
    .style({
      // usagePrefix: str => chalk.hex('#9961ed').bold(str),
      flags: str => chalk.bold(str),
      group: str => chalk.hex('#9961ed').bold(str),
      messages: str => chalk.keyword('orange').bold(str)
    });

  // Introduced this function due to https://github.com/sywac/sywac/issues/25
  const shouldParseAndexit = (argv) => {
    const command = argv[2];
    const arg = argv[3];
    return argv.length < 3
      || command === 'about'
      || command === '-v' || command === '--version'
      || command === '-h' || command === '--help'
      || (command !== 'test' && command !== 'testplan' && command !== 'status')
      || (command === 'test' && !!arg) || (command === 'testplan' && !!arg) || (command === 'status' && !!arg);
  };

  const cliArgs = shouldParseAndexit(options.argv) ? await api.parseAndExit() : await api.parse();

  if (cliArgs.errors && cliArgs.errors.length) log.error(cliArgs.errors);
};

module.exports = { processCommands };
