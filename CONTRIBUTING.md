# Contributing

Contributions from community are key to making purpleteam a high quality comprehensive resource. Lets make purpleteam awesome together!

## Ways to Contribute

Depending on your preference, you can contribute in various ways.

Often the best approach is to discuss what you're thinking of or planning first. You can do this by:

* Starting a [Github Discussion](https://github.com/purpleteam-labs/purpleteam/discussions) in the purpleteam repository
* Having a chat about it on the purpleteam-labs [Slack](https://purpleteam-labs.slack.com). If you need an invite DM us on Twitter [@purpleteamlabs](https://twitter.com/purpleteamlabs), or reach out via the BinaryMist website [contact section](https://binarymist.io/#contact)

The purpleteam-labs [Backlog/Project board](https://github.com/purpleteam-labs/purpleteam/projects/2) lists work items for all of the purpleteam-labs projects waiting for someone to start work on. These can be a good place to start.

You can also [open an issue](https://github.com/purpleteam-labs/purpleteam/issues/new/choose), or send a Pull Request (PR).

We also have a [Roadmap](https://github.com/purpleteam-labs/purpleteam/projects/1) for Epics a little further out.

If you are OK with creating a PR that may never be accepted, then go ahead and just create the PR and use the description to provide context and motivation, as you would for an issue.

## Coding

### Production Code

* If you modify existing code that has tests for it, please modify the tests first to help you drive your development, include the tests with the PR and make sure they are passing before submitting
* If you modify existing code that does not yet have tests, please create tests for the modified code, include them with the PR and make sure they are passing before submitting
* If you are creating new code, please drive that creation with tests and include the tests in your PR
* If the code you create requires modification or additional documentation to be added to the official docs, please include the modified or new documentation with your PR

### Experimental Code

If you are writing experimental or example code that you don't expect to be included in the purpleteam production code base the [Production Code](#production-code) guidelines can be relaxed.

### Guidelines for Pull Request (PR) submission and processing:

Daniel Stenberg's post on "[This Is How I Git](https://daniel.haxx.se/blog/2020/11/09/this-is-how-i-git/)" provides a good example of what we expect as a git work-flow.

#### Style/Linting JavaScript

The output of eslint needs to be error free before submitting a PR. This should take place automatically as part of the git `pre-commit` on most purpleteam-lab projects.
For example: `git commit` will run the `pre-commit` hook, which runs the `test` script before allowing commit. The `test` script has a `pretest` script which runs `npm run lint`

We use npm scripts for most build tasks.

#### What should you, the author of a Pull Request (PR) expect from us (purpleteam-labs Team)?

* How much time (maximum) until the first feedback? 1 week
* And following iterations? 1 week
* This is a deadline we should normally be able to hit. If it's been more than a week and you haven't heard then please feel free to add a comment to your PR and @ mention the team (@purpleteam-labs/team-purpleteam-labs)

#### What do we (purpleteam-labs Team) expect from you?

* Choose the granularity of your commits consciously and squash commits that represent multiple edits or corrections of the same logical change. "Atomic commits" (logical changes to be in a single commit). Please don't group disjointed changes into a single commit/PR
* Descriptive commits (subject and message)
* Discussion about the changes:
  * If there is a prior issue, reference the GitHub issue number in the description of the PR
  * Should be done in/on the PR or via the [Github Discussions](https://github.com/purpleteam-labs/purpleteam/discussions) and a link to that Discussion thread added to the PR comments. (i.e.: Shared information is important, if something happens via [Slack](https://purpleteam-labs.slack.com/) or private email please ensure a summary makes it to the PR)
  * Discussion will be kept in the PR unless off topic
* If accepted, your contribution may be heavily modified as needed prior to merging. You will likely retain author attribution for your git commits granted that the bulk of your changes remain intact. You may also be asked to rework the submission
* If asked to make corrections, simply push the changes against the same branch, and your pull request will be updated. In other words, you do not need to create a new pull request when asked to make changes
* No merge commits. Please, rebase
* Rebase if the branch has conflicts
* Please, leave a comment after force pushing changes. It allows everyone to know that new changes are available
* How much time will a PR be left open?
  * This isn't static, one or more members of the purpleteam-labs Team will reach out (using @ mentions in PR comments) once or twice in order to get things back on track. If no input is received after a month or two then the PR will be closed. Total stale time will likely be 2 to 3 months
  * Close with a message such as: "The PR was closed because of lack of activity (as per CONTRIBUTING guidelines)". Labelled as "Stale"
  * If the contribution is deemed important or still valuable the code may be:
    * Manually merged (if possible)
    * Retrieved by another member of the team, fixed up and resubmitted. In which case the commit message (PR message) should contain a reference to the original submission

#### Approval process:

* All PRs must be approved by a minimum of two members (if they exist) of the purpleteam-labs Core Team (other than the author) and anyone who is flagged as a reviewer on the PR
* The PR author can optionally specify any reviewer they would like to review their PR and any member of the Core Team can add themselves as a reviewer. This will effectively prevent the PR from being merged until they approve it
* Any member of the Core Team can merge a PR as long as the above conditions are met
* Reviews by people outside of the Core Team are still appreciated :)  
  Helping to review PR is another great way to contribute. Your feedback can help to shape the implementation of new features. When reviewing PRs, however, please refrain from approving or rejecting a PR unless you are a purpleteam-labs Core Team member

## Reference Docs

The reference documentation is in the [purpleteam-doc](https://github.com/purpleteam-labs/purpleteam-doc) repository.

