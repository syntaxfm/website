---
number: 401
title: Hasty Treat - How to Setup a PNPM Monorepo
date: 1635771600142
url: https://traffic.libsyn.com/syntax/Syntax401.mp3
---

In this Hasty Treat, Scott and Wes talk about PNPM and monorepos!

## Freshbooks - Sponsor
Get a 30 day free trial of Freshbooks at [freshbooks.com/syntax](https://freshbooks.com/syntax) and put SYNTAX in the "How did you hear about us?" section.

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes

4:40 - What is pnpm?
* [https://pnpm.io/](https://pnpm.io/)
* Performant npm
* [https://www.youtube.com/watch?v=hiTmX2dW84E](https://www.youtube.com/watch?v=hiTmX2dW84E)
* Find and remove node modules
  * `find . -name "node_modules" -type d -prune -exec rm -rf '{}' +`

08:30 - Why monorepo?
* Internal packages all in one place
* Forks and custom packages easier
* Commands that control everything at once

10:33 - Workspaces
* Not exclusive to pnpm
* Yarn, npm, pnpm all have them now
  * Different syntax
```jsx
packages:
  - "packages/**"
```

12:48 - How it works in practice
* All commands run through root
* Use in host, hook up my monorepo to render run commands
* Filter and recursive
* `"install:all": "pnpm recursive install",`
* `"clean": "pnpm recursive exec -- rm -rf node_modules; rm shrinkwrap.yaml; rm -rf node_modules",`
* `"ui:dev": "pnpm recursive run dev --filter @leveluptuts/ui",`

16:35 - Using submodules
* [https://paigeniedringhaus.substack.com/p/march-2021-git-submodules](https://paigeniedringhaus.substack.com/p/march-2021-git-submodules)
* Why submodules?
* Public and private

## Links
* [https://www.npmjs.com/package/npx](https://www.npmjs.com/package/npx)
* [https://yarnpkg.com/](https://yarnpkg.com/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets