---
number: 323
title: Hasty Treat - New Level Up Tutorials Site
date: 1612188000858
url: https://traffic.libsyn.com/syntax/Syntax323.mp3
---

In this Hasty Treat, Scott and Wes talk about the new Level Up Tutorials website — some of the new tech powering the site, behind-the-scenes decisions, previous iterations, and more!

## Freshbooks - Sponsor
Get a 30 day free trial of Freshbooks at [freshbooks.com/syntax](https://freshbooks.com/syntax) and put SYNTAX in the "How did you hear about us?" section.

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

02:55 - Previous iterations
* Originally on [Drupal 7](https://www.drupal.org/drupal-7.0)
* Full re-write to [Meteor](https://www.meteor.com/) + [Blaze](http://blazejs.org/)
  * Two sites — store.leveluptutorials.com and leveluptutorials.com
* [Meteor](https://www.meteor.com/) + [React](https://reactjs.org/)
* [Meteor](https://www.meteor.com/) + [Apollo](https://www.apollographql.com/)
* Combine store and site
* Move to [TypeScript](https://www.typescriptlang.org/)
* [NOW](https://vercel.com/)

05:30 - Big choices
* No [Babel](https://babeljs.io/) up and down the stack
* UI
  * Mostly unchanged — [React](https://reactjs.org/) + [Styled Components](https://styled-components.com/) + [SCSS](https://sass-lang.com/)
    * Moving more to SCSS, CSS vars
    * Build and dev done via [Snowpack](https://www.snowpack.dev/)
      * 50ms hot reloadin'
      * Mega fast development workflow has been a huge plus
      * Errors in the UI via [Snowpack](https://www.snowpack.dev/)
      * Wrote a custom [GraphQL](https://graphql.org/) importer plugin
* API
  * [ESBuild](https://esbuild.github.io/)
    * Insane speeds
    * Wrote a custom [GraphQL](https://graphql.org/) importer plugin
  * [Mercurious](https://mercurius.dev/) / [Fastify](https://www.fastify.io/)
* Codegen
  * [GraphQL](https://graphql.org/) code gen to create everything we need for a fully typed codebase
  * Auto-generated [React Hooks](https://reactjs.org/docs/hooks-intro.html)
* Hosting
  * [render.com](http://render.com) for both
* CLI
  * Custom avalanche CLI that removes the guesswork and makes bulk operations easy
* [Caddy](https://caddyserver.com/) server for easy `leveluptutorials.dev` in local environments
* Testing
  * [Jest](https://jestjs.io/) → API
  * [Cypress](https://www.cypress.io/) → UI

## Links
* [Digital Ocean app platform](https://www.digitalocean.com/blog/introducing-digitalocean-app-platform-reimagining-paas-to-make-it-simpler-for-you-to-build-deploy-and-scale-apps/)
* [https://beta.leveluptutorials.com/](https://beta.leveluptutorials.com/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets