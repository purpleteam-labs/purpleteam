const pkg = require('package.json');

exports.flags = '*';
exports.desc = 'Default command (shows the interactive screen).';
exports.setup = {};
exports.run = (parsedArgv, context) => {
  const argv = parsedArgv;
  argv.handled = true;

  if (parsedArgv.about) {
    const {
      name: projectName, version, description, homepage, author: { name, email }
    } = pkg;

    console.log(`\n${projectName} ${version}`); // eslint-disable-line no-console
    console.log(description); // eslint-disable-line no-console
    console.log(`Homepage: ${homepage}`); // eslint-disable-line no-console
    console.log(`Created by ${name}<${email}>\n`); // eslint-disable-line no-console
  } else {
    return context.cliMessage(`Unknown argument: ${context.args}`);
  }
  return argv;
};
