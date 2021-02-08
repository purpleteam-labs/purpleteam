<div align="center">
  <br/>
  <a href="https://purpleteam-labs.com" title="purpleteam">
    <img width=900px src="https://github.com/purpleteam-labs/purpleteam/blob/main/assets/images/purpleteam-banner.png" alt="purpleteam logo">
  </a>
  <br/>
  <br/>
  <h2>purpleteam CLI</h2><br/>
    CLI component of <a href="https://purpleteam-labs.com/" title="purpleteam">purpleteam</a> - Currently in alpha
  <br/><br/>

  <a href="https://www.gnu.org/licenses/agpl-3.0" title="license">
    <img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="GNU AGPL">
  </a>

  <a href="https://github.com/purpleteam-labs/purpleteam/commits/main" title="pipeline status">
    <img src="https://github.com/purpleteam-labs/purpleteam/workflows/Node.js%20CI/badge.svg" alt="pipeline status">
  </a>

  <a href='https://coveralls.io/github/purpleteam-labs/purpleteam?branch=main'>
    <img src='https://coveralls.io/repos/github/purpleteam-labs/purpleteam/badge.svg?branch=main' alt='test coverage'>
  </a>

  <a href="https://snyk.io/test/github/purpleteam-labs/purpleteam?targetFile=package.json" title="known vulnerabilities">
    <img src="https://snyk.io/test/github/purpleteam-labs/purpleteam/badge.svg?targetFile=package.json" alt="known vulnerabilities"/>
  </a>
  <br/><br/>
  <a href="https://purpleteam-labs.com" title="purpleteam">
    <img width=900px src="https://user-images.githubusercontent.com/2862029/104117134-a93b7780-5383-11eb-8270-bfc46f310a24.png" alt="purpleteam test run">
  </a>

<br/><br/>
</div>

# Install

There are several options.

## Clone the git repository

If you are planning on running/debugging purpleteam standalone, cloning is a good option.

From a directory that you would like the CLI cloned to run the following command:

```shell
git clone https://github.com/purpleteam-labs/purpleteam.git
```

## NPM install locally

If you are planning on running/debugging purpleteam from another NodeJS process, for example a CI/nightly build/build pipeline project of your own, installing via NPM is a good option.

For the locally installed via NPM option the purpleteam-labs Team uses the [purpleteam-build-test-cli](https://github.com/purpleteam-labs/purpleteam-build-test-cli) project as an example to test that this option works as expected. The following example [package.json](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/main/package.json) and [index.js](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/main/index.js) files are from the purpleteam-build-test-cli example project.

You may notice that this example exports the `local` `NODE_ENV` environment variable. That means that purpleteam will be using the local [configuration](#configure). If instead you have signed up for a cloud license, you will want to be targeting the `cloud` environment instead.

Using the above mentioned example build project files, assuming your NodeJS build project has the same following files:

<div id="purpleteam-build-test-cli"></div>

[**package.json**](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/main/package.json)

```json
{
  "name": "purpleteam-test",  
  "main": "index.js",
  "scripts": {
    "// Don't forget to export any required env vars before running the purpleteam CLI. For example": "env NODE_ENV='local' ",
    "// Invoke purpleteam binary from NPM script": "npm run purpleteam",
    "purpleteam": "env NODE_ENV='local' purpleteam",
    "// Start your node app": "npm start",
    "start": "env NODE_ENV='local' node index.js",
    "// Debug your node app": "npm run debugApp",
    "debugApp": "env NODE_ENV='local' node --inspect-brk=localhost:9230 index.js",
    "// Debug your node app and the purpleteam CLI": "npm run debugAppAndCli",
    "debugAppAndCli": "env NODE_ENV='local' env DEBUG_PURPLETEAM='true' node --inspect-brk=localhost:9230 index.js"
  },
  "dependencies": {
    "purpleteam": "*"
  }
}
```

[**index.js**](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/main/index.js)

```javascript
const { spawn } = require('child_process');

// You will need to define two debuggers in what ever tool you're using.
// localhost:9230 and localhost:9231
const execArgvDebugString = '--inspect-brk=localhost';
const childProcessInspectPort = 9231;
// You can run any of the purpleteam commands [about|status|test|testplan], `test` is just one example.
const purpleteamArgs = ['purpleteam', 'test'];

startPurpleteam = () => {
  const purpleteam = spawn('node', [
    ...(process.env.DEBUG_PURPLETEAM
    ? [`${execArgvDebugString}:${childProcessInspectPort}`]
    : []),
    ...purpleteamArgs],
    { cwd: `${process.cwd()}/node_modules/.bin/`, env: process.env, argv0: process.argv[0] }
  );

  purpleteam.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  purpleteam.stderr.on('data', (data) => {
    process.stdout.write(data);
  });
  purpleteam.on('exit', (code, signal) => {
    console.debug(`Child process "purpleteam" exited with code: "${code}", and signal: "${signal}".`);
  });
  purpleteam.on('close', (code) => {
    console.debug(`"close" event was emitted with code: "${code}" for "purpleteam".`);
  });
  purpleteam.on('error', (err) => {
    process.stdout.write(`Failed to start "purpleteam" sub-process. The error was: ${err}.`);
  });
};

startPurpleteam();
```

From within your NodeJS build project run the following command to install the purpleteam CLI locally into your NodeJS project:  

```shell
npm install
```

### NPM install globally

For example, you may have a build project/pipeline that is written in some language besides JavaScript. In this case the most suitable install technique may be to install the purpleteam CLI globally.

To do so, run the following command:  

```shell
npm install -g purpleteam
```
Now the purpleteam CLI is installed and on your path to invoke from anywhere on your system.

# Configure

If you are planning on using the `cloud` environment copy the config/config.example.cloud.json to config/config.cloud.json and make the necessary changes.
If you are planning on using the `local` environment copy the config/config.example.local.json to config/config.local.json and make the necessary changes.

Use the config/config.js for documentation and further examples.

**`loggers.testerProgress.dirname`** Configure this value.

**`purpleteamApi`** If you are planning on using the `local` environment you can stick with the default property values. If you are planning on using the `cloud` environment you will be given this information when you sign-up for a purpleteam account.

**`testerFeedbackComms.medium`** Long Polling (`lp`) is supported in both `local` and `cloud` environments. Server Sent Events (`sse`) is only supported in the `local` environment due to AWS limitations. Both `lp` and `sse` are real-time. Both implementations have their pros and cons.

Using `sse` is one way communications after the initial subscription from the CLI to the orchestrator. Redis pub/sub is used between the testers and the orchestrator to publish tester feedback. If the CLI is stopped (not subscribed) at any point while the back-end is in a test run, events will be lost.

Using `lp` is request-response communications. A request is made and only answered when there are tester feedback messages available, or the application specific (rather than AWS Api Gateway) time-out is exceeded. As soon as the CLI receives a set (one to many) of tester feedback messages, it makes another request to the orchestrator (if running in `local` env), or API (if running in `cloud` env). Redis pub/sub is used between the testers and the orchestrator to publish tester feedback.  
So long as the initial CLI request for tester feedback is made immediately after testing has begun, tester feedback messages will be persisted in memory to Redis lists. This means that if the CLI is stopped momentarily during a test run, when it is restarted it will receive the tester feedback messages that arrived at the orchestrator when the CLI wasn't running... providing the orchestrator continues running.

> Additional background: This may change in the future, WebSockets is also an option we may implement in the future, but implementing WebSockets would mean we would have to change our entire authn approach. Our chosen cloud infrastructure AWS Api Gateway does not support streaming and it does not support the OAuth Client Credentials Flow with Cognito User Pools.

**`purpleteamAuth`** If you are planning on using the `local` environment you can stick with the default property values. If you are planning on using the `cloud` environment you will be given this information when you sign-up for a purpleteam account.

**`buildUserConfig.fileUri`** Configure this value if you do not want to manually pass it as an arguement to the CLI. This is the _Job_ file you have configured to specify your System Under Test (SUT) details.

If you installed the purpleteam CLI via `git clone` (You are intending to run purpleteam CLI standalone), then a relative directory path from the root of the repository ("./testResources/jobs/your_job_file") is acceptable.  
If you installed the purpleteam CLI via `npm install` Then it's more likely that you will need this path to be absolute, as the current directory (./) is more than likely not going to be within the purpleteam CLI project itself, but rather wherever the purpleteam binary is itself.

This value can be [overridden](#run-the-purpleteam-cli-directly---with-test-options) by passing it in as an option to the commands that require it (currently `test` and `testplan`).

**`outcomes.dir`** Configure this value. This is a directory of your choosing that outcome files from the orchestrator (if running in `local` env), or API (if running in `cloud` env) will be persisted to.

<br>

Purpleteam uses the convict package for it's configuration.

## Sensitive Values (`cloud` environment only)

There are several ways you can handle the sensitive values that need to be read into the purpleteam CLI to access your instance of the purpleteam Cloud service:

* Place sensitive values in-line in the `config.cloud.json` file, providing you are confident that you have sufficiently locked down file, directory permissions and access to the host that will be running the purpleteam CLI
* Place sensitive values in a similarly structured file but in some other directory that the purpleteam CLI has access to and is sufficiently locked down as previously mentioned. The path of which said file can be [added to the array](https://github.com/mozilla/node-convict/tree/master/packages/convict#configloadfilefile-or-filearray) as an element that is feed to `config.loadFile` in the main `config.js` file
* Place sensitive values in environment variables yourself, or pass them as environment variables in the current shell to the purpleteam CLI:  
  ```js
  env PURPLETEAM_APP_CLIENT_ID="<app-client-id>" env PURPLETEAM_APP_CLIENT_SECRET="<app-client-secret>" env PURPLETEAM_API_KEY="<api-key>" purpleteam test
  ```

The precedence order of where values will be read from is defined by [convict](https://github.com/mozilla/node-convict/tree/master/packages/convict#precedence-order).

# Run

There are several ways you can run the purpleteam CLI. The following list some. Make sure you have [installed](#install) and [configured](#configure) purpleteam correctly before running:

## Clone the git repository option

For those that chose to [clone](#clone-the-git-repository) the purpleteam CLI:

### Run the bin/purpleteam file via npm script

1. From the root directory of the purpleteam repository
2. Run one of the following commands
   * To start the CLI:  
     ```shell
     env NODE_ENV="local" npm start
     # Should print out the purpleteam top level help
     ```
     <img width=900px src="https://user-images.githubusercontent.com/2862029/107207208-e9664680-6a64-11eb-9ea9-48f40e8ef155.png" alt="purpleteam top level help">
   * To start the CLI and pass commands (`status` for example):  
     ```shell
     env NODE_ENV="local" npm start status
     # Should print the following message if the orchestrator is not running:
     # ☰  notice     [dashboard] orchestrator is down, or an incorrect URL has been specified in the CLI config.
     ```
   * To start the CLI and pass commands (`test` for example):  
     ```shell
     env NODE_ENV="local" npm start test
     # Should print the following message if the orchestrator is not running:
     # ✖  critical   [apiDecoratingAdapter] orchestrator is down, or an incorrect URL has been specified in the CLI config.
     ```
   * To start the CLI and pass commands (`test` for example) with options:  
     ```shell
     env NODE_ENV="local" npm start test -- --help
     # Should print the available options for the test command:
     ```
   * To debug the CLI (passing the `status` command for example):  
     ```shell
     env NODE_ENV="local" npm run debug status
     # Amongst other messages, you should see the following message:
     # Debugger listening on ws://localhost:9230/...
     ```
     Now open your debugging UI. If you use the chrome developer tools browse to `chrome://inspect` and click the inspect link and you will be dropped into the purpleteam CLI code-base.

### Run the bin/purpleteam file directly

1. From the root directory of the purpleteam repository
2. Run one of the following commands
   * To start the CLI:  
     ```shell
     env NODE_ENV="local" bin/purpleteam
     # Should print out the purpleteam top level help
     ```
   * To start the CLI and pass commands (`status` for example):  
     ```shell
     env NODE_ENV="local" bin/purpleteam status
     # Should print the following message if the orchestrator is not running:
     # ☰  notice     [dashboard] orchestrator is down, or an incorrect URL has been specified in the CLI config.
     ```
   * To start the CLI and pass commands (`test` for example):  
     ```shell
     env NODE_ENV="local" bin/purpleteam test
     # Should print the following message if the orchestrator is not running:
     # ✖  critical   [apiDecoratingAdapter] orchestrator is down, or an incorrect URL has been specified in the CLI config.
     ```
   * To start the CLI and pass commands (`test` for example) with options:  
     ```shell
     env NODE_ENV="local" bin/purpleteam test --help
     # Should print the available options for the test command:
     ```

## NPM install locally option

For those that chose to [install locally via npm](#npm-install-locally):

Providing your package.json and the JavaScript file (index.js in the [above example](#purpleteam-build-test-cli)) that is going to run the purpleteam CLI is similar to those configured in the above file examples, you should be able to successfully run the following commands from the root directory of your NodeJS CI/nightly build/build pipeline project.

### Run the purpleteam CLI directly

```shell
npm run purpleteam
# Should print out the purpleteam top level help
```

### Run the purpleteam CLI directly - with `status` command

Run the purpleteam CLI directly but pass the `status` command to `purpleteam`:

```shell
npm run purpleteam status
# Should print the following message if the orchestrator is not running:
# ☰  notice     [dashboard] orchestrator is down, or an incorrect URL has been specified in the CLI config.
```

### Run the purpleteam CLI directly - with `test` command

Run the purpleteam CLI directly but pass the `test` command to `purpleteam`:

```shell
npm run purpleteam test
# Should print the following message if the orchestrator is not running:
# ✖  critical   [apiDecoratingAdapter] orchestrator is down, or an incorrect URL has been specified in the CLI config.
```

### Run the purpleteam CLI directly - with `test` options

Run the purpleteam CLI directly but you want to see the help options for the `test` command:

```shell
npm run purpleteam test -- --help
# Should print the available options for the test command:
```

### Run your app

Run your NodeJS CI/nightly build/build pipeline project. This will start the NodeJS application we [defined above](#purpleteam-build-test-cli) which will [`spawn`](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/189d2f42de46b1484d6195a048505da61cfcd201/index.js#L12-L18) the [`purpleteam test`](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/189d2f42de46b1484d6195a048505da61cfcd201/index.js#L8) command.

You could change the `const purpleteamArgs = ['purpleteam', 'test'];` to use any other purpleteam CLI commands, options, or neither. 

```shell
npm start
# Should print the following via the purpleteam.stdout.on('data'... handler
# ✖  critical   [apiDecoratingAdapter] orchestrator is down, or an incorrect URL has been specified in the CLI config.
```

### Debug your app

If you need to debug your NodeJS CI/nightly build/build pipeline project, run the following command:

```shell
npm run debugApp
```

Now open your debugging UI. If you use the chrome developer tools browse to `chrome://inspect` and click the inspect link and you will be dropped into your app (index.js in this case).

### Debug your app and purpleteam CLI

If you need to debug your NodeJS CI/nightly build/build pipeline project as well as the purpleteam CLI, do the following:

1. Make sure your debugging UI is configured to listen on the application and CLI debug ports:
   * `localhost:9230` as defined in the above package.json
   * `localhost:9231` as defined in the above index.js
2. run the following command:  
   ```shell
   npm run debugAppAndCli
   ```
3. Then open your debugging UI. If you use the chrome developer tools browse to `chrome://inspect` and click the "inspect" link and you will be dropped into your app (index.js in this case)
4. Step through the index.js file until the purpleteam process is spawned, at which point you will see the second "inspect" link if using the chrome developer tools
5. Click the second "inspect" link and you should be dropped into the purpleteam source code. Now you can step through and inspect both your application code and the purpleteam CLI code



## NPM install globally option
