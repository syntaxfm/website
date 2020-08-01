---
number: 272
title: React State Round Up
date: 1596632400603
url: https://traffic.libsyn.com/syntax/Syntax272.mp3
---

In this episode of Syntax, Scott and Wes talk about React State libraries, should you use them, pros, cons, and more!

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

01:24 - [Context](https://reactjs.org/docs/context.html)

* Have we used?
  * Scott: Yes
  * Wes: Yes 
* Pros
  * Built into React
  * As simple or complex as you want
* Cons
  * Takes effort to optimize
  * Takes effort to plan and organize aka can get out of hand quickly

08:49 - [Redux](https://react-redux.js.org/)

* Have we used?
  * Scott: Yes
  * Wes: Yes
* Pros 
  * Huge user base
  * Legacy of growth and improvements
  * Modern API
  * Even though it's hard to learn, it has a clear "how to build with it" path
  * Dev tools
* Cons
  * Complex
  * Thing that calls a thing that calls a thing that calls a thing
  * Confusion around what additional packages are needed, e.g. ducks, saga, whatever

17:08 - [XState](https://xstate.js.org/)

* Have we used?
  * Scott: Yes
  * Wes: No
* Pros
  * Enforces solid design patterns
  * Very safe
  * Awesome tooling like UI to see state machines
  * [https://xstate.js.org/viz/](https://xstate.js.org/viz/)
* Cons
  * Knowledge overhead - having to understand state machines
  * Complex syntax

23:26 - [Zustand](https://github.com/react-spring/zustand)

* Have we used?
  * Scott: Yes
  * Wes: No
* Pros
  * Fast, scalable, easy to use
  * Simpler
  * No context providers
* Cons
  * Smaller community 2.6k stars on Github
  * Can inform components transiently (without causing render)

27:04 - [Apollo Client](https://www.apollographql.com/docs/react/)

* Have we used?
  * Scott: Yes
  * Wes: Yes
* Pros 
  * Fits in well with your GraphQL API
  * Dev tools
* Cons
  * Complex, large syntax for simple operations
  * Dev tools
  * SSR story is really complex. It's hard because they aren't also the framework. 

31:35 - [RXJS](https://github.com/ReactiveX/rxjs)

* Have we used?
  * Scott: No
  * Wes: No
* Observable based

33:02 - [React Query](https://github.com/tannerlinsley/react-query)

* Have we used?
  * Scott: No
  * Wes: 
* Pros
  * Fast growing community
  * Awesome dev tools
* Cons
  * Not sure if this can be used for application state or just data

35:37 - [Recoil](https://recoiljs.org/)

* Have we used?
  * Scott: Yes
  * Wes: No
* Pros
  * Very good for complex, splintered state needs
* Cons
  * Overly complex for most use cases

38:34 - [MobX](https://mobx.js.org/)

* Have we used?
  * Scott: No
  * Wes: No
* Pros
  * Big community
  * Not just React
  * Powerful
  * Observable capabilities
* Cons
  * Uses decorators, but doesn't have to? 

43:15 - [Easy Peasy](https://easy-peasy.now.sh/)

* Have we used?
  * Scott: No
  * Wes: No
* Pros
  * Simple API (easy peasy)
  * Redux dev tools supported

45:06 - [Meteor ReactiveDict](https://docs.meteor.com/api/reactive-dict.html) / [ReactiveVar](https://docs.meteor.com/api/reactive-var.html)

* Have we used?
  * Scott: Yes
  * Wes: No
* Pros
  * Very simple
  * Get, set
  * Is Reactive
* Cons
  * Lock-in to Meteor

46:19 - Final Thoughts On State

* Wes: Go for simpler solutions
* Scott: I think application state should be separate from application data, but maybe that's because there isn't a solution that does both how I want

## Links
* [Svelte](https://svelte.dev/)
* [Meteor](https://www.meteor.com/)
* [Syntax 206: State Machines, CSS and Animations with David K Piano](https://syntax.fm/show/206/state-machines-css-and-animations-with-david-k-piano)
* [Syntax 268: Potluck - Beating Procrastination × Rollup vs Webpack × Leadership × Code Planning × Styled Components × More!](https://syntax.fm/show/268/potluck-beating-procrastination-rollup-vs-webpack-leadership-code-planning-styled-components-more)
* [Zustand CodeSandbox](https://codesandbox.io/s/v8pjv251w7)
* [swr](https://github.com/vercel/swr)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Becoming Bond](https://www.imdb.com/title/tt6110504/)
* Wes: [IRWIN VISE-GRIP GrooveLock Pliers Set](https://amzn.to/2ZjPybo) 

## Shameless Plugs
* Scott: [Modern CSS Design Systems](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [All Courses](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets