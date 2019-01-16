---
number: 28
title: Async + Await
date: 1516207708549
url: https://traffic.libsyn.com/syntax/Syntax028.mp3
---

## Freshbooks — Sponsor

If you are a small business or freelancer check out [Freshbooks.com Cloud Accounting](https://freshbooks.com/syntax) and get 30 days free. Make sure to enter SYNTAX into the "How did you hear about us" section.

## Show Notes

02:55

* [Wes' Async + Await talk on YouTube from DotJS](https://www.youtube.com/watch?v=9YkUCxvaLEk)
* JavaScript is Asynchronous
* [Ryan Dhal (Creator of Node.js) original Node.js talk](https://www.youtube.com/watch?v=ztspvPYybIY)

06:00

* Callback Hell
* Q
* Bluebird
* What is a promise?
* Promises are an IOU

8:30

* Async + Await IS promises
* What is Async + Await?
* How does the code look?
* Returning values from an await

15:20

* Performance Considerations
* MEGA PROMISES
* `Promise.all()`
* Here is an example:
* const [weather, store] = Promise.all(getWeather(), getStores());

19:22

* This stuff is 100% native
* Most new Browser APIs are build on Promises
* [Fetch()](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
* Some examples:
* `await fetch('https://api.github.com/users/wesbos').then(data => data.json())`
* OR
* `await (await fetch('https://api.github.com/users/wesbos')).json()`
* [Axios](https://github.com/axios/axios)

22:48

* [The Payment Request API](https://developers.google.com/web/fundamentals/payments/)
* You should listen to episode 006 on [accepting money on the internet](https://syntax.fm/show/006/accepting-money-on-the-internet)
* Web Animation API

27:00

* Snackisodes
* Snack Packs
* Hasty Treats?!!!

28:00

* Making callback-based functions promised basked
* [es6-promisify](https://www.npmjs.com/package/es6-promisify)
* [util.promisify()](http://2ality.com/2017/05/util-promisify.html)

30:00

* Error Handling Methods
* View [my slides](https://wesbos.github.io/Async-Await-Talk/) for some code examples.
* Try/Catch
* High Order Function
* Just handle the error when you `callIt().catch(dealWithIt);`
* Node's `process.on('unhandledRejection')` event

36:00

* Browser Support
* Babel it!

38:00

* [AbortController()](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
* [Abortable Fetch](https://developers.google.com/web/updates/2017/09/abortable-fetch)

## SIIIIICK PICKS

42:00

* Scott: [Ring Doorbell](http://amzn.to/2DEUJaL)
* Wes: [The Indicator Podcast](https://www.npr.org/sections/money/567724614/the-indicator)

47:00

* Sick Tip
* Chrome's Autoplay is changing
* [Details on this](https://developers.google.com/web/updates/2017/09/autoplay-policy-changes)
* Visit chrome://media-engagement to see your scores

## Shameless Plugs

* [Fullstack GraphQL](https://www.youtube.com/channel/UCyU5wkjgQYGRB0hIHMwm2Sg)
* [CSS Grid Course is coming sooooon!](https://CSSGrid.io)

## Tweet us your tasty treats!

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
