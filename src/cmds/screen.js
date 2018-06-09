const pkg = require(`${process.cwd()}/package.json`);

exports.flags = '*';
exports.desc = 'Default command (shows the interactive screen).';
exports.setup = (sywac) => {};
exports.run = (parsedArgv, context) => {
  debugger;
  parsedArgv.handled = true;  


  if (parsedArgv.about) {
    const { name: projectName, version, description, homepage, author: { name, email } } = pkg;
    console.log(`\n${projectName} ${version}`);
    console.log(description);
    console.log(`Homepage: ${homepage}`);
    console.log(`Created by ${name}<${email}>\n`);
  } else {
    return context.cliMessage(`Unknown argument: ${context.args}`);
  }
};

