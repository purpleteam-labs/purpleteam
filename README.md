<div align="center">
  <br/>
  <a href="https://purpleteam-labs.com" title="purpleteam">
    <img width=900px src="https://gitlab.com/purpleteam-labs/purpleteam/raw/master/assets/images/purpleteam-banner.png" alt="purpleteam logo">
  </a>
  <br/>
<br/>
<h2>purpleteam CLI</h2><br/>
  Currently in heavy development
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

<br/><br/><br/>
</div>


Along with the other components in the PurpleTeam solution, this project is the interface project:

* [purpleteam](https://github.com/binarymist/purpleteam) (node.js CLI, driven from CI / nightly build)
* [purpleteam-orchestrator](https://github.com/binarymist/purpleteam-orchestrator) (hapi.js orchestrator - SaaS interface, this package)
* purpleteam-advisor (machine learning module which continuously improves tests, plugs into orchestrator, future roadmap)
* Testers:
  * [purpleteam-app-scanner](https://github.com/binarymist/purpleteam-app-scanner) (web app / api scanner)
  * purpleteam-server-scanner (web server scanner)
  * purpleteam-tls-checker (TLS checker)
  * etc

## Definitions

 Key                 | Value   
---------------------|---------
 _Build User_        | The person that: <ul><li>Creates the configuration for PurpleTeam</li><li>Creates test specifications if overriding desired</li></ul> 
 _Purple Team_       | Organisation with _Build Users_ that consume _PurpleTeam_ 
 _Testers_           | The microservices responsible for managing the different types of security testing you require. The intention is that you will be able to add your own
 _Slaves_            | Containerised tools that do the _Testers_ bidding, ZapAPI, Nikto, sslyze, etc. The intention is that you will be able to add your own
 _SUT_               | System Under Test (your application / API) 
 _Test Session_      | Defined by the specific _SUT_ user, for example you could have a _Test Session_ for a low privileged user and one for an admin user, both testing the same areas of the _SUT_ 
 _Job_               | Test job defined by the config `POST`ed to the `purpleteam-orchestrator` `/test` route
 

## Installation

`npm install -g purpleteam`

## Commands

These are the commands run by a _Build User_:

`purpleteam`  
This will run purpleteam in dashboard mode.

`purpleteam -h`  
Will do what you think, show help.

`purpleteam test`  
Standard test run. Will provide the _Build User_ with a test plan of what is about to be tested, while immediatly starting testing.

`purpleteam testplan`  
Same as `test`, but only runs to create test plan and provide back to the _Build User_. The test plan will show you what is going to be tested before you actually run `test`. You can think of it as a `purpleteam test --dry-run`.

If you decide to clone rather than install from NPM, from within the packages root directory, you can run the above commands like:  
`npm start` instead of `purpleteam`  
`npm start -- -h` instead of `purpleteam -h`  
`npm start -- test` instead of `purpleteam test`  
`npm start -- testplan`instead of `purpleteam testplan`

