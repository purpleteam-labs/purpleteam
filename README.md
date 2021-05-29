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
  <br/><br/>
  <a href="https://purpleteam-labs.com" title="purpleteam">
    <img width=900px src="https://user-images.githubusercontent.com/2862029/104117134-a93b7780-5383-11eb-8270-bfc46f310a24.png" alt="purpleteam test run">
  </a>

<br/><br/>
</div>

If you are planning on running the `local` environment, once you have installed, configured and are ready to run the purpleteam CLI, head back to the [local setup](https://doc.purpleteam-labs.com/local/local-setup.html) documentation and make sure all of the otther purpleteam components are also set-up and ready to run. After that work through the [local workflow](https://doc.purpleteam-labs.com/local/local-workflow) documentation.

If you are planning on targeting the `cloud` environment, the purpleteam CLI is all you need to have set-up.

If you have any issues with the set-up, be sure to check the [trouble shooting](https://doc.purpleteam-labs.com/trouble-shooting.html) page.

# Contents

* [Install](#install)
  * [Clone the git repository](#clone-the-git-repository)
  * [NPM install locally](#npm-install-locally)
  * [NPM install globally](#npm-install-globally)
* [Configure](#configure)
  * [Job File](#job-file)
  * [CLI](#cli)
* [Run](#run)
  * [Clone the git repository option](#clone-the-git-repository-option)
    * [Run the bin/purpleteam file via npm script](#run-the-binpurpleteam-file-via-npm-script)
    * [Run the bin/purpleteam file directly](#run-the-binpurpleteam-file-directly)
  * [NPM install locally option](#npm-install-locally-option)
    * [Run the purpleteam CLI directly](#run-the-purpleteam-cli-directly)
    * [Run the purpleteam CLI directly - with `status` command](#run-the-purpleteam-cli-directly---with-status-command)
    * [Run the purpleteam CLI directly - with `test` command](#run-the-purpleteam-cli-directly---with-test-command)
    * [Run the purpleteam CLI directly - with `test` options](#run-the-purpleteam-cli-directly---with-test-options)
    * [Run your app (build pipeline)](#run-your-app-build-pipeline)
    * [Debug your app (build pipeline)](#debug-your-app-build-pipeline)
    * [Debug your app and purpleteam CLI](#debug-your-app-and-purpleteam-cli)
  * [NPM install globally option](#npm-install-globally-option)
* [Usage](#usage)


# Install

There are several options.

## Clone the git repository

If you are planning on running/debugging purpleteam standalone, cloning is a good option.

From a directory that you would like the CLI cloned to run the following command:

```shell
git clone https://github.com/purpleteam-labs/purpleteam.git
```

Install the dependencies with the following command:

```
npm install
```

Another option with cloning if you want the purpleteam CLI to be available as a system wide command is to use the following command from the repositories root directory:

```
npm link
```

## NPM install locally

If you are planning on running/debugging purpleteam from another NodeJS process, for example a CI/nightly build/build pipeline project of your own, installing via NPM is a good option.

For the locally installed via NPM option the purpleteam-labs Team uses the [purpleteam-build-test-cli](https://github.com/purpleteam-labs/purpleteam-build-test-cli) project as an example to test that this option works as expected. The following example [package.json](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/main/package.json) and [index.js](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/main/index.js) files are from the purpleteam-build-test-cli example project.

This example exports two environment variables:

* `NODE_ENV=local`: Means that purpleteam will be using the `local` [configuration](#cli). If instead you have signed up for a cloud license, you will want to be targeting the `cloud` environment instead
* `PURPLETEAM_UI=noUi`: As detailed in the [Configure](#cli) sub-section

Using the above mentioned example build project files, and for the sake of this example, let's assume your NodeJS build project has the same following files:

<div id="purpleteam-build-test-cli"></div>

[**package.json**](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/main/package.json)

```json
{
  "name": "purpleteam-build-test-cli",
  "description": "Used to test that the purpleteam CLI runs within a build pipeline successfully",
  "main": "index.js",
  "scripts": {
    "// Don't forget to export any required env vars before running the purpleteam CLI. For example": "NODE_ENV=local and PURPLETEAM_UI=noUi",
    "// Invoke purpleteam binary from NPM script": "npm run purpleteam",
    "purpleteam": "NODE_ENV=local purpleteam",
    "// Start your node app": "npm start",
    "start": "NODE_ENV=local PURPLETEAM_UI=noUi node index.js",
    "// Debug your node app": "npm run debugApp",
    "debugApp": "NODE_ENV=local PURPLETEAM_UI=noUi node --inspect-brk=localhost:9230 index.js",
    "// Debug your node app and the purpleteam CLI": "npm run debugAppAndCli",
    "debugAppAndCli": "NODE_ENV=local PURPLETEAM_UI=noUi DEBUG_PURPLETEAM=true node --inspect-brk=localhost:9230 index.js"
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

## NPM install globally

For example, you may have a build project/pipeline that is written in some language besides JavaScript. In this case the most suitable install technique may be to install the purpleteam CLI globally.

To do so, run the following command:  

```shell
npm install -g purpleteam
```
Now the purpleteam CLI is installed and on your path to invoke from anywhere on your system.

```shell
which purpleteam
# Will print where purpleteam is located.
# You will need this to configure it if you choose to install globally.
```

As mentioned under the [Clone](#clone-the-git-repository) section, another option for a system wide install is to use `npm link`.

# Configure

## Job File

The [_Job_](https://doc.purpleteam-labs.com/definitions.html) file (also referred to as the `buildUserConfig`) is what purpleteam uses to do the following. Most properties should be self documenting. If you are unsure of any, start a [Github discussion](https://github.com/purpleteam-labs/purpleteam/discussions) or reach out in the [#project-purpleteam channel of OWASP Slack](https://owasp.slack.com/messages/project-purpleteam).
Examples of _Job_ files that the purpleteam-labs team uses can be found [here](https://github.com/purpleteam-labs/purpleteam/tree/main/testResources/jobs):

* Authenticate to your [System Under Test (_SUT_)](https://doc.purpleteam-labs.com/definitions.html)
* Locate your SUT
* Which browser to use to test your application in
* Define your [_Test Session_](https://doc.purpleteam-labs.com/definitions.html)
* Alert Threshold
* Routes to test
* Fields of each specific route, other fields "may" also be tested

## CLI

No matter which install option you decide on the purpleteam CLI will require configuration.

If you are planning on using the `cloud` environment copy the config/config.example.cloud.json to config/config.cloud.json and make the necessary changes.
If you are planning on using the `local` environment copy the config/config.example.local.json to config/config.local.json and make the necessary changes.

Use the config/config.js for documentation and further examples.

**`loggers.testerProgress.dirname`**: Configure this property.

**`loggers.testPlan.dirname`**: Configure this property. Using the same value as used for `loggers.testerProgress.dirname` is an option.

**`purpleteamApi`**: If you are planning on using the `local` environment you can stick with the default property values. If you are planning on using the `cloud` environment you will be given this information when you sign-up for a purpleteam account.

**`testerFeedbackComms.medium`**: Long Polling (`lp`) is supported in both `local` and `cloud` environments. Server Sent Events (`sse`) is only supported in the `local` environment due to AWS limitations. Both `lp` and `sse` are real-time. Both implementations have their pros and cons.

Which ever option you choose, the same option must be applied to both the [_orchestrator_](https://doc.purpleteam-labs.com/definitions.html) and the purpleteam CLI.

Using `sse` is one way communications after the initial subscription from the CLI to the _orchestrator_. Redis pub/sub is used between the _Testers_ and the _orchestrator_ to publish _Tester_ feedback. If the CLI is stopped (not subscribed) at any point while the back-end is in a test run, events will be lost.

Using `lp` is request-response communications. A request is made and only answered when there are [_Tester_](https://doc.purpleteam-labs.com/definitions.html) feedback messages available, or the application specific (rather than AWS Api Gateway) time-out is exceeded. As soon as the CLI receives a set (one to many) of _Tester_ feedback messages, it makes another request to the _orchestrator_ (if running in `local` env), or API (if running in `cloud` env). Redis pub/sub is used between the _Testers_ and the _orchestrator_ to publish _Tester_ feedback.  
So long as the initial CLI request for _Tester_ feedback is made immediately after testing has begun, _Tester_ feedback messages will be persisted in memory to Redis lists. This means that if the CLI is stopped momentarily during a test run, when it is restarted it will receive the _Tester_ feedback messages that arrived at the _orchestrator_ when the CLI wasn't running... providing the _orchestrator_ continues running.

> Additional background: This may change in the future, WebSockets is also an option we may implement in the future, but implementing WebSockets would mean we would have to change our entire authn approach. Our chosen cloud infrastructure AWS Api Gateway does not support streaming and it does not support the OAuth Client Credentials Flow with Cognito User Pools.

**`purpleteamAuth`**: If you are planning on using the `local` environment you can stick with the default property values. If you are planning on using the `cloud` environment you will be given this information when you sign-up for a purpleteam account.

<div id="buildUserConfig_fileUri"></div>

**`buildUserConfig.fileUri`**: Configure this property if you do not want to manually pass it as an argument to the CLI. This is the _Job_ file you have configured to specify your System Under Test (SUT) details.

If you installed the purpleteam CLI via `git clone` (You are intending to run purpleteam CLI standalone), then a relative directory path from the root of the repository ("./testResources/jobs/your_job_file") is acceptable.  
If you installed the purpleteam CLI via `npm install` Then it's more likely that you will need this path to be absolute, as the current directory (./) is more than likely not going to be within the purpleteam CLI project itself, but rather wherever the purpleteam binary is itself.

This value can be [overridden](#run-the-purpleteam-cli-directly---with-test-options) by passing it in as an option to the commands that require it (currently `test` and `testplan`).

**`outcomes.dir`**: Configure this property. This is a directory of your choosing that outcome files from the purpleteam API (_orchestrator_ if running in `local` env, AWS API Gateway if running in `cloud` env) will be persisted to.

<div id="configure-ui"></div>

**`uI`**: This property is configured by default to use the character user interface (`cUi` value) (your terminal).
This value can be changed in one of the following ways:

* Change it directly in config/config.js
* Add an override to your: config/config.local.json if running in the `local` environment, or config/config.cloud.json if running in the `cloud` environment
* Exporting the `PURPLETEAM_UI` environment variable (`PURPLETEAM_UI=noUi`) for example

`uI` options:

* `cUi`: Is well suited to running the purpleteam CLI directly in your terminal.  
   With the `uI` configured to use `cUi` the following putpleteam CLI commands have the associated behaviours:  
    * `about`: Writes to the console using the [purpleteam-logger](https://www.npmjs.com/package/purpleteam-logger) configured with the `SignaleTransport`  
    * `status`: Writes to the console using the purpleteam-logger configured with the `SignaleTransport`, via blessed  
    * `test`: Writes to file using purpleteam-logger configured with the `File` transport. Writes to the console using blessed. On a successful test run, an outcomes zip file will be written to the directory specified by `outcomes.dir`  
    * `testplan`: Writes to the console using blessed
* `noUi`: Is well suited to running the purpleteam CLI from another process (your build/CI/CD process for example).
   With the `uI` configured to use `noUi` the following putpleteam CLI commands have the associated behaviours:  
    * `about`: Writes to the console using the purpleteam-logger configured with the `SignaleTransport`  
    * `status`: Writes to the console using the purpleteam-logger configured with the `SignaleTransport`  
    * `test`: Writes to file using purpleteam-logger configured with the `File` transport. On a successful test run, an outcomes zip file will be written to the directory specified by `outcomes.dir`  
    * `testplan`: Writes to file using purpleteam-logger configured with the `File` transport

<br>

Purpleteam uses the convict package for it's configuration.

## Sensitive Values (`cloud` environment only)

There are several ways you can handle the sensitive values that need to be read into the purpleteam CLI to access your instance of the purpleteam Cloud service:

* Place sensitive values in-line in the `config.cloud.json` file, providing you are confident that you have sufficiently locked down [file, directory permissions](https://f1.holisticinfosecforwebdevelopers.com/chap03.html#vps-identify-risks-unnecessary-and-vulnerable-services-overly-permissive-file-permissions-ownership-and-lack-of-segmentation) and access to the host that will be running the purpleteam CLI
* Place sensitive values in a similarly structured file but in some other directory that the purpleteam CLI has access to and is sufficiently locked down as previously mentioned. The path of which said file can be [added to the array](https://github.com/mozilla/node-convict/tree/master/packages/convict#configloadfilefile-or-filearray) as an element that is feed to `config.loadFile` in the main `config.js` file
* Place sensitive values in environment variables yourself, or pass them as environment variables in the current shell to the purpleteam CLI:  
  ```js
  PURPLETEAM_APP_CLIENT_ID=<app-client-id> PURPLETEAM_APP_CLIENT_SECRET=<app-client-secret> PURPLETEAM_API_KEY=<api-key> purpleteam test
  ```

The precedence order of where values will be read from is defined by [convict](https://github.com/mozilla/node-convict/tree/master/packages/convict#precedence-order).

# Run

There are several ways you can run the purpleteam CLI. The following list some. Make sure you have [installed](#install) and [configured](#cli) purpleteam correctly before running:

## Clone the git repository option

For those that chose to [clone](#clone-the-git-repository) the purpleteam CLI:

You can choose to export the `NODE_ENV` environment variable before running the following commands, or simply do so as part of running the commands. For example: `NODE_ENV=local` or `NODE_ENV=cloud`.

### Run the bin/purpleteam file via npm script

1. From the root directory of the purpleteam repository
2. Run one of the following commands
   * To start the CLI:  
     ```shell
     npm start
     # Should print out the purpleteam top level help
     ```
     <div id="purpleteam-top-level-help"></div>
     <img width=900px src="https://user-images.githubusercontent.com/2862029/107207208-e9664680-6a64-11eb-9ea9-48f40e8ef155.png" alt="purpleteam top level help">
   * To start the CLI and pass commands (`status` for example):  
     ```shell
     npm start status
     # Should print the following message if the orchestrator is not running:
     # ☰  notice     [cUi] orchestrator is down, or an incorrect URL has been specified in the CLI config.
     ```
   * To start the CLI and pass commands (`test` for example):  
     ```shell
     npm start test
     # Should print the following message if the orchestrator is not running:
     # ✖  critical   [apiDecoratingAdapter] orchestrator is down, or an incorrect URL has been specified in the CLI config.
     ```
   * To start the CLI and pass commands (`test` for example) with options:  
     ```shell
     npm start test -- --help
     # Should print the available options for the test command:
     ```
   * To debug the CLI (passing the `status` command for example):  
     ```shell
     npm run debug status
     # Amongst other messages, you should see the following message:
     # Debugger listening on ws://localhost:9230/...
     ```
     Now open your debugging UI. If you use the chrome developer tools browse to `chrome://inspect` and click the inspect link and you will be dropped into the purpleteam CLI code-base.

### Run the bin/purpleteam file directly

1. From the root directory of the purpleteam repository
2. Run one of the following commands
   * To start the CLI:  
     ```shell
     bin/purpleteam
     # Should print out the purpleteam top level help
     ```
   * To start the CLI and pass commands (`status` for example):  
     ```shell
     bin/purpleteam status
     # Should print the following message if the orchestrator is not running:
     # ☰  notice     [cUi] orchestrator is down, or an incorrect URL has been specified in the CLI config.
     ```
   * To start the CLI and pass commands (`test` for example):  
     ```shell
     bin/purpleteam test
     # Should print the following message if the orchestrator is not running:
     # ✖  critical   [apiDecoratingAdapter] orchestrator is down, or an incorrect URL has been specified in the CLI config.
     ```
   * To start the CLI and pass commands (`test` for example) with options:  
     ```shell
     bin/purpleteam test --help
     # Should print the available options for the test command:
     ```

Or if you chose to clone the purpleteam CLI repository and `npm link` it, you can run it as a first class citizen:

```
purpleteam
```

## NPM install locally option

For those that chose to [install locally via npm](#npm-install-locally):

The `NODE_ENV` environment variable needs to be exported so that the purpleteam CLI knows whether it's targeting the `cloud` or `local` environment and configuration. In the example build project we have used, `NODE_ENV` is exported as part of the NPM [scripts](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/main/package.json#L11), and it is using the `local` environment.

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
# Should print the following message if the orchestrator is not yet running. Be patient, purpleteam CLI retries:
# ☰  notice     [cUi] orchestrator is down, or an incorrect URL has been specified in the CLI config.
```

### Run the purpleteam CLI directly - with `test` command

Run the purpleteam CLI directly but pass the `test` command to `purpleteam`:

```shell
npm run purpleteam test
# Should print the following message if the orchestrator is not yet running:
# ✖  critical   [apiDecoratingAdapter] orchestrator is down, or an incorrect URL has been specified in the CLI config.
```

### Run the purpleteam CLI directly - with `test` options

Run the purpleteam CLI directly but you want to see the help options for the `test` command:

```shell
npm run purpleteam test -- --help
# Should print the available options for the test command:
```

### Run your app (build pipeline)

Run your NodeJS CI/nightly build/build pipeline project. This will start the NodeJS application we [defined above](#purpleteam-build-test-cli) which will [`spawn`](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/189d2f42de46b1484d6195a048505da61cfcd201/index.js#L12-L18) the [`purpleteam test`](https://github.com/purpleteam-labs/purpleteam-build-test-cli/blob/189d2f42de46b1484d6195a048505da61cfcd201/index.js#L8) command.

You could change the `const purpleteamArgs = ['purpleteam', 'test'];` to use any other purpleteam CLI commands, options, or neither.

When running the purpleteam CLI from another process, you will usually want to export `PURPLETEAM_UI=noUi` as mentioned in the [NPM install locally](#npm-install-locally) sub-section and detailed in the [Configure `uI`](#configure-ui) sub-section.

```shell
npm start
# If the orchestrator is not yet running:
# Should print the following via the purpleteam.stdout.on('data'... handler
# ✖  critical   [apiDecoratingAdapter] orchestrator is down, or an incorrect URL has been specified in the CLI config.
```

If you get a blank screen or purpleteam help text with an error or warning via a `?⃝  warning` logged to your terminal, please confirm you have [configured](#buildUserConfig_fileUri) purpleteam correctly.

When running the purpleteam CLI embedded, you should expect the behaviours specified under the [Configure `uI`](#configure-ui) sub-section for the associated purpleteam CLI commands.

### Debug your app (build pipeline)

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

For those that chose to [install globally via npm](#npm-install-globally):

You can choose to export the `NODE_ENV` environment variable before running the following commands, or simply do so as part of running the commands.

```shell
NODE_ENV=local purpleteam
# Or export NODE_ENV then just run:
purpleteam
# Should print out the purpleteam top level help
```

Run any of the [purpleteam CLI commands](#purpleteam-top-level-help) as you would with the install of any other system wide binary.

If you choose to clone the purpleteam CLI repository and run `npm link` from it's root directory, the same applies. Plus you get to continue to modify the purpleteam CLI config without reinstalling.

# Usage

If you are running the purpleteam CLI in the default [character user interface (`cUi`) mode](#configure-ui) there are some interactions you can perform in the terminal while the CLI is running.
The following commands have the associated interactions available:

* `test`: Once testing is under way, you can:
  * [right-arrow], [left-arrow] through the terminal screens to view the testing progress of each of the [_Testers_](https://doc.purpleteam-labs.com/definitions.html) in real-time courtesy of the purpleteam API
  * [down-arrow], [up-arrow] to highlight the different Running Statistics of the _Testers_ as they are provided in real-time courtesy of the purpleteam API
* `testplan`: Once the test plans have been retreived, you can [right-arrow], [left-arrow] through the terminal screens to view the test plans of each specific [_Tester_](https://doc.purpleteam-labs.com/definitions.html)

