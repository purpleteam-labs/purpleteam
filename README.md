<div align="center">
  <br/>
  <a href="https://purpleteam-labs.com" title="purpleteam">
    <img width=900px src="https://gitlab.com/purpleteam-labs/purpleteam/raw/master/assets/images/purpleteam-banner.png" alt="purpleteam logo">
  </a>
  <br/>
  <br/>
  <h2>purpleteam CLI</h2><br/>
    Currently in alpha
  <br/><br/>

  <a href="https://gitlab.com/purpleteam-labs/purpleteam/commits/master" title="pipeline status">
     <img src="https://gitlab.com/purpleteam-labs/purpleteam/badges/master/pipeline.svg" alt="pipeline status">
  </a>

  <a href="https://gitlab.com/purpleteam-labs/purpleteam/commits/master" title="test coverage">
     <img src="https://gitlab.com/purpleteam-labs/purpleteam/badges/master/coverage.svg" alt="test coverage">
  </a>

  <a href="https://snyk.io/test/github/purpleteam-labs/purpleteam?targetFile=package.json" title="known vulnerabilities">
    <img src="https://snyk.io/test/github/purpleteam-labs/purpleteam/badge.svg?targetFile=package.json" alt="known vulnerabilities"/>
  </a>
  <br/><br/>
  <a href="https://purpleteam-labs.com" title="purpleteam">
    <img width=900px src="https://gitlab.com/purpleteam-labs/purpleteam/uploads/2101d9c56556f77490c696fb4d39c742/EndOfTestRun.png" alt="purpleteam test run">
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
