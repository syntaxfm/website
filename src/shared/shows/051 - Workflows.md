---
number: 51
title: Our Workflows — Design, Development, Git and Deployment
date: 1529499600620
url: https://traffic.libsyn.com/syntax/Syntax051.mp3
---

It's a workflow extravaganza! Scott and Wes talk about their development workflows, covering everything from design to deployment.

## Cofeecup's CSS Grid Builder Tool — Sponsor

Check out Coffeecup's [CSS Grid.cc](https://cssgrid.cc/) builder tool and resources to learn, prototype and build next gen layouts with CSS Grid!

## VueSchool.io's Vue.js Masterclass — Sponsor
Check out [VueSchool.io's new Vue.js Masterclass](https://vueschool.io/) taught by Alex Kyriakidis. Learn Vue.js along with best practices, modern Javascript, and other exciting technologies, by building a real-world application - a forum. The first 50 people to visit [VueSchool.io/syntax](https://vueschool.io/syntax) to get 25% off.

## Show Notes

4:00 - Design Workflow

* Wes:
  * Screenshots of look + feels
  * Sketch layouts out in pencil
  * Mock up layout in Sketch
  * Once rough layout is done, I refine
  * Once I have: colors, type, patterns, textures and overall layout, I move to code.
  * A design program is important to vs designing in code

* Scott
  * Mirrored component structure in Figma
  * Using Ideas from Atomic design and React components
  * Goal is for Figma components to be 100% mapped to styled components
  * Flexible and testable in different layouts
  * My design philosophy is refinement through iteration
  * Light theft
    * Footer from [Pitchfork](https://pitchfork.com/)
    * New card animation idea from [Patagonia](http://www.patagonia.com/)

15:55 - Design to Dev Workflow

* Wes:
  * Happy with design so far
  * Setup tooling - styled components, stylus, sass...
  * Setup type, variables, partials, resets...
  * Do as much HTML as possible before styling
  * CSS it up for layouts, then go section by section
  * Broad first, then zoom in on finesse
  * Browsersync / Hot Reload
  * Test across browsers / Devices

* Scott:
  * Define parameters in Figma
  * Styled components in React, hand write that CSS bruh
  * Move aspects of styled components lib like breakpoints, colors, functions, helpers, base components

32:06 - Git Workflow

* Wes:
  * Tear off a branch - name after issue - DEV113
  * Do your work
  * Rebase
  * Squash
  * Pull Request
  * Rinse + Repeat

* Scott
  * Master branch is 1-1 with live
  * Develop is where work is done (but not really because I make a feature branch for each feature and merge in)
  * Contributors issue pull requests into develop

42:34 - Deployment Workflow

* Scott:
  * Hosted on Meteor Galaxy, container based hosting
  * Develop is merged into master, all tests run, if everything passes tests and manual check, I deploy to Galaxy via NPM script.
  * Soon I'll be adding in automated test running & auto deploy to galaxy on push to master.
  * Secrets are kept in a settings.json file that's used during deployment.

* Wes:
  * Codeship
  * DeployHQ
  * Git
  * Rsync
  * Dealing with secrets

49:53 - Project Folder Structure

* Wes:
  * Folder Structure - 0100, 0101…

* Scott:
  * API
  * UI
    * element -> styled components with index
  * Startup
  * Utilities

## Links

* [BNO Train Wreck Album](https://upload.wikimedia.org/wikipedia/en/thumb/3/33/BNO-trainwreck_cover.jpg/220px-BNO-trainwreck_cover.jpg)
* [Atomic Design](http://bradfrost.com/blog/post/atomic-web-design/)
* [Guide Design Systems](https://www.invisionapp.com/blog/guide-to-design-systems/)
* [BrowserSync](https://browsersync.io/)
* [FontSquirrel](https://www.fontsquirrel.com/)
* [fontplop](https://www.fontplop.com/)
* [Creative Market](https://creativemarket.com/)
* [Delicious Brain's WP Migrate DB Pro](https://deliciousbrains.com/wp-migrate-db-pro/)
* [Ryan Dahl - 10 Things I Regret About Node.js](https://www.youtube.com/watch?v=M3BM9TB-8yA)

## ××× SIIIIICK ××× PIIIICKS ×××

* Scott: [Overcooked - Nintendo Switch](https://www.nintendo.com/games/detail/overcooked-special-edition-switch)
* Wes: [SkyRoam Solis](https://www.skyroam.com?rfsn=1346968.ac598)

## Shameless Plugs

* [Scott's Level 2 React Course](https://LevelUpTutorials.com/store)
* [Wes' Courses](https://wesbos.com/courses)

## Tweet us your tasty treats!

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
