---
number: 367
title: Hasty Treat - JavaScript Event Buzzwords — Sync, Concurrent, Defer, Blocking, Workers
date: 1625490000210
url: https://traffic.libsyn.com/syntax/Syntax367.mp3
---

In this Hasty Treat, Scott and Wes define some JavaScript Buzzwords and talk about what they mean!

## Freshbooks - Sponsor
Get a 30 day free trial of Freshbooks at [freshbooks.com/syntax](https://freshbooks.com/syntax) and put SYNTAX in the "How did you hear about us?" section.

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Show Notes
03:24 - Synchronous / Async

05:23 - Multi-threaded
* JavaScript has a single "main thread"
* But you can have more threads with web workers

08:12 - Blocking
* JavaScript can stop other things on the page from running
* A script tag can block HTML from being parsed
* Most stuff in JavaScript is non-blocking
* Node.js write to filesystem can be blocking

10:27 - Concurrent + Parallel
* JavaScript start/stop are concurrent
* The API runs on a different thread
* Doesn't REALLY matter
* [https://joearms.github.io/published/2013-04-05-concurrent-and-parallel-programming.html](https://joearms.github.io/published/2013-04-05-concurrent-and-parallel-programming.html)

13:22 - Consecutive / Waterfall
* One after another

13:48 - Callback
* A function to run when this thing *happens* or *is done*
* Click event callback
* Websocket on data callback
  * Like a tweet stream
* Data fetch callback
  * Almost entirely replaced with  async + await
* [http://callbackhell.com/](http://callbackhell.com/)
* [https://caolan.github.io/async/v3/](https://caolan.github.io/async/v3/)

17:56 - Script Tag Async + Defer
* Doesn't block other content
* Runs when ready - doesn't care about DOMcontentLoaded
* Wait until the page is loaded before running
* If the script tag is above content, don't wait for it
* Good for things that aren't called on page load

21:54 - Lazy
* Load it in later - maybe when it's scrolled into view, or as needed
* Not mission-critical

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets