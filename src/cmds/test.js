
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

exports.flags = 'test';
exports.description = 'Launch purpleteam to attack your specified target';
exports.setup = (sywac) => {
  debugger;
  sywac.option('-c, --config-file <config-file path>', 
    {type: 'file', desc: 'Build user supplied configuration file. Must be a file conforming to the schema defined in the purpleteam documentation.', strinct: true, mustExist: true});
};
exports.run = async (parsedArgv, context) => {
  debugger;
  if (parsedArgv.c) {
    // Get the file and validate it.
    let configFileContents;
    try {
      configFileContents = await readFileAsync(parsedArgv.c, {encoding: 'utf8'})
      debugger;
    }
    catch (err) {
      console.log(`Could not read file: ${parsedArgv.c}, the error was: ${err}`)
      debugger;
    }
    debugger;
    console.log(`We have your file ${parsedArgv.c}`)

    // Todo: KC: 





    // Todo: KC: Start the testing.
    console.log('Ok, so test is running');

  } else {
    context.cliMessage(`You must provide a valid build user configuration file that exists on the local file system.`);
  }

  parsedArgv.handled = true;  
};

