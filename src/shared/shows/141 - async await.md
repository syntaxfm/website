---
number: 141
title: Hasty Treat - Async + Await Error Handling Strategies
date: 1557147600789
url: https://traffic.libsyn.com/syntax/Syntax141.mp3
---

In this Hasty Treat, Scott and Wes discuss different error handling strategies.

## Sentry - Sponsor

If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

2:07 - Try / Catch

* This can be done at call time or inside the function

4:10 - Higher Order Function

* Makes a function that returns a new function which in turn calls your original function (but with a `.catch` chained on)

7:46 - Handle the error when you call it

* Use async/await but chain a `.catch` onto the end 

9:03 - Node.js Unhandled Rejection Event

* `process.on('unhandledRejectionEvent', callback)`

9:40 - What to do with those errors

* Send to error tracking service
* Possible to give the user a reference number
* Display good error text to user

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
