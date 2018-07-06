const log = require('purpleteam-logger').logger();
const pkg = require('package.json');

exports.flags = '*';
exports.desc = 'Default command (shows the interactive screen).';
exports.setup = {};
exports.run = (parsedArgv, context) => {

  if (parsedArgv.about) {
    const {
      name: projectName, version, description, homepage, author: { name, email }
    } = pkg;

    log.emerg('This is what an emergency looks like.', { tags: ['emerg-tag'] });
    log.alert('This is what an alert looks like.', { tags: ['alert-tag'] });
    log.crit('This is what a critical event looks like.', { tags: ['crit-tag'] });
    log.error('This is what an error looks like.', { tags: ['error-tag'] });
    log.warning('This is what a warning looks like.', { tags: ['warning-tag'] });
    log.notice('This is what a notice looks like.', { tags: ['notice-tag'] }); 
    log.info('This is what an info event looks like.', { tags: ['info-tag'] });
    log.debug('This is what a debug event looks like.', { tags: ['debug-tag'] });

    log.notice(`${projectName} ${version}`, { tags: ['screen'] });
    log.notice(description, { tags: ['screen'] });
    log.notice(`Homepage: ${homepage}`, { tags: ['screen'] });
    log.notice(`Created by ${name}<${email}>\n`, { tags: ['screen'] });
  } else {
    return context.cliMessage(`Unknown argument: ${context.args}`);
  }
  return parsedArgv;
};
