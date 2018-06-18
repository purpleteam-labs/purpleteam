const log = require('purpleteam-logger').logger();
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

    log.notice(`${projectName} ${version}`, {tags: ['screen']});
    log.notice(description, {tags: ['screen']});
    log.notice(`Homepage: ${homepage}`, {tags: ['screen']});
    log.notice(`Created by ${name}<${email}>\n`, {tags: ['screen']});
  } else {
    return context.cliMessage(`Unknown argument: ${context.args}`);
  }
  return argv;
};
