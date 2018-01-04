# Contributing to authmosphere

**Thank you for your interest in making this project even better and more awesome. Your contributions are highly welcome.**

There are multiple ways of getting involved:

- [Report a bug](#report-a-bug)
- [Suggest a feature](#suggest-a-feature)
- [Contribute code](#contribute-code)

Below are a few guidelines we would like you to follow.
If you need help, please open a github Issue in this project. If you work at Zalando reach out to us at Team Graviton.

## Report a bug
Reporting bugs is one of the best ways to contribute. Before creating a bug report, please check that an
[issue](https://github.com/zalando-incubator/authmosphere/issues) reporting the same problem does not already exist. If there is an
such an issue, you may add your information as a comment.

To report a new bug, open an issue that summarizes the bug and set the label to "bug".

If you want to provide a fix along with your bug report: That is great! In this case please send us a pull request as
described in section [Contribute Code](#contribute-code).

## Suggest a Feature
To request a new feature, open an [issue](https://github.com/zalando-incubator/authmosphere/issues/new) and summarize the desired
functionality and its use case. Set the issue label to "feature".

## Contribute code
This is a rough outline of what the workflow for code contributions looks like:
- Check the list of open [issues](https://github.com/zalando-incubator/authmosphere/issues). Either assign an existing issue to
yourself, or create a new one that you would like work on and discuss your ideas and use cases.
- Fork the repository
- Create a feature branch. Best practise for naming:

```
<branch name> = <Github issue ticket number>-<component-name>-<whatever-describes-the-ticket>
```

- Make commits of logical units.
- Lint your contribution by ```npm run tslint``` before committing
- Write good commit messages ([see below](#commit-messages)).
- Push your changes to a topic branch in your fork of the repository.
- Submit a pull request
- Your pull request must receive a :thumbsup: from two [maintainers](https://github.com/zalando-incubator/authmosphere/blob/master/MAINTAINERS).

Thanks for your contributions!

### Commit messages
* Commit message format (use editor for comfortable multi line):
```
feat(feature): commit message
^--^^-------^  ^------------^
|     |             |
|     |             +-> Summary
|     |
|     +-> scope
|
+-------> Type: chore, docs, feat, fix, refactor, style, or test.
<blank line>
close #<ticket number>
```

Additional information on the format:
[Type description (by Angular.js project)](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#type)
[Angular.js commit guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#commits)
* Finally: Create pull request. When creating a pull request, its comment should reference the corresponding issue id.

**Have fun and enjoy hacking!**
