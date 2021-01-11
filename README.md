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

# Installation

## Simplest

`npm install -g purpleteam`

## If you want to debug

Clone this repository.

# Configuration

Copy the config/config.example.json to either config/config.local.json or config/config.cloud.json depending on which environment you are planning on using.  
Use the config/config.js for documentation and further examples.  

**`loggers.testerProgress.dirname`** Configure this value.

**`purpleteamApi`** If you are planning on using the `local` environment you can stick with the default property values. If you are planning on using the `cloud` environment you will be given this information when you sign-up for a purpleteam account.

**`testerFeedbackComms.medium`** Long Polling (`lp`) is supported in both `local` and `cloud` environments. Server Sent Events (`sse`) is only supported in the `local` environment due to AWS limitations. Both `lp` and `sse` are real-time. Both implementations have their pros and cons.

Using `sse` is one way communications after the initial subscription from the CLI to the orchestrator. Redis pub/sub is used between the testers and the orchestrator to publish tester feedback. If the CLI is stopped (not subscribed) at any point while the back-end is in a test run, events will be lost.

Using `lp` is request-response communications. A request is made and only answered when there are tester feedback messages available, or the application specific (rather than AWS Api Gateway) timeout is exceeded. As soon as the CLI receives a set (one to many) of tester feedback messages, it makes another request to the orchestrator (if running in `local` env), or API (if running in `cloud` env). Redis pub/sub is used between the testers and the orchestrator to publish tester feedback.  
So long as the initial CLI request for tester feedback is made immediatly after testing has begun, tester feedback messages will be persisted in memory to Redis lists. This means that if the CLI is stopped momentarily during a test run, when it is restarted it will receive the tester feedback messages that arrived at the orchestrator when the CLI wasn't running... providing the orchestrator continues running.

> Additional background: This may change in the future, WebSockets is also an option we may implement in the future, but implementing WebSockets would mean we would have to change our entire authn approach. Our chosen cloud infrastructure AWS Api Gateway does't support streaming and it doesn't support the OAuth Client Credentials Flow with Cognito User Pools.

**`purpleteamAuth`** If you are planning on using the `local` environment you can stick with the default property values. If you are planning on using the `cloud` environment you will be given this information when you sign-up for a purpleteam account.

**`buildUserConfig.fileUri`** Configure this value if you do not want to manually pass it as an arguement to the CLI. This is the _Job_ file you have configured to specify your System Under Test (SUT) details.

**`outcomes.dir`** Configure this value. This is a directory of your choosing that outcomes files from the orchestrator (if running in `local` env), or API (if running in `cloud` env) will be persisted to.

<br>

Purpleteam uses the convict package for it's configuration.

## Sensitive Values (`cloud` environment only)

There are several ways you can handle the sensitive values that need to be read into the purpleteam CLI to access your instance of the purpleteam Cloud service:

* Place sensitive values inline in the `config.cloud.json` file, providing you are confident that you have sufficiently locked down file, directory permissions and access to the host that will be running the purpleteam CLI
* Place sensitive values in a similarly structured file but in some other directory that the purpleteam CLI has access to and is sufficiently locked down as previously mentioned. The path of which said file can be [added to the array](https://github.com/mozilla/node-convict/tree/master/packages/convict#configloadfilefile-or-filearray) as an element that is feed to `config.loadFile` in the main `config.js` file
* Place sensitive values in environment variables yourself, or pass them as environment variables in the current shell to the purpleteam CLI:  
  ```js
  env PURPLETEAM_APP_CLIENT_ID="<app-client-id>" env PURPLETEAM_APP_CLIENT_SECRET="<app-client-secret>" env PURPLETEAM_API_KEY="<api-key>" purpleteam test
  ```

The precedence order of where values will be read from is defined by [convict](https://github.com/mozilla/node-convict/tree/master/packages/convict#precedence-order).

