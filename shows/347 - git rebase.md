---
number: 347
title: Hasty Treat - Git Rebase Explained
date: 1619442000543
url: https://traffic.libsyn.com/syntax/Syntax347.mp3
---

In this Hasty Treat, Scott and Wes talk about Git Rebase — what it is and how and when to use it!

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Show Notes
05:12 - Why and when to rebase?
* `git rebase -i` is interactive
* Rebase allows you to rewind your current branch, apply the changes of another branch to it, and then on top of that, apply your new commits.
* Common uses:
  * Squash all commits into one or multiple commits
  * Reword commits
* These lines can be re-ordered — they are executed from top to bottom.
  * `p`, pick <commit> = use commit
  * `r`, reword <commit> = use commit, but edit the commit message
  * `e`, edit <commit> = use commit, but stop for amending
  * `s`, squash <commit> = use commit, but meld into previous commit
  * `f`, fixup <commit> = like "squash", but discard this commit's log message
  * `x`, exec <command> = run command (the rest of the line) using shell
  * `b`, break = stop here (continue rebase later with 'git rebase --continue')
  * `d`, drop <commit> = remove commit
  * `l`, label <label> = label current HEAD with a name
  * `t`, reset <label> = reset HEAD to a label
  * `m`, merge [-C <commit> | -c <commit>] <label> [# <oneline>]

## Links
* [Git Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets