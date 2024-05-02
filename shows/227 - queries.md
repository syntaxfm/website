---
number: 227
title: Hasty Treat - The Status of Element Queries / Container Queries
date: 1583157600634
url: https://traffic.libsyn.com/syntax/Syntax227.mp3
---

In this Hasty Treat, Scott and Wes talk about container queries, what they are and how you can use them.

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

4:30 - The General Idea

* [Toward Responsive Elements — Brian Kardell](https://bkardell.com/blog/TowardResponsive.html?1)

6:20 - Problems

* It's not as easy as, "how do we write them"
* Some of the requirements may need a fundamental change to browser engines
  * May be very impractical and take a long time

> "Did you know, for example, that there are multiple many year long efforts with huge investments underway already aimed at unlocking many new things in CSS? There are - and I don't mean Houdini!" ~ Brian Kardell

8:56 - What's been happening?

* Lots of conversations
* Dead ends

> "How do we make this into more solvable problems?" and "How do we actually make some progress, mitigate risk - take a step, and and actually get something to developers?" ~ Brian Kardell

* 'containment' and ResizeObserver,
  * [Implemented in all browsers in about 2 years](https://webkit.org/blog/9997/resizeobserver-in-webkit/)

12:00 - Progress

* Lot's of discussion
  * Goog, Moz, Apple, smart people
* Not there yet
* Big ideas that could go somewhere

`.foo {
  display: grid;
  grid-template-columns: switch(
    (available-inline-size > 1024px) 1fr 4fr 1fr;
    (available-inline-size > 400px) 2fr 1fr;
    (available-inline-size > 100px) 1fr;
    default 1fr;
    );
  }`

> "A whole lot of the problems with existing ideas is that they heave to loop back through (expensive) phases potentially several times and make it (seemingly) impossible to keep CSS rendering in the same frame."  ~ Brian Kardell

* Or a system based on resizeObserver

> "In the coming months I hope to continue to think about, explore this space and continue discussions with others. I would love to publish some research and maybe some new (functional) experiments with JS that aim to be 'closer' to a path that might be paveable." ~ Brian Kardell

* [https://github.com/ZeeCoder/container-query](https://github.com/ZeeCoder/container-query)
* [https://github.com/FreddyFY/styled-container-query](https://github.com/FreddyFY/styled-container-query)

## Links
* [uses.tech](https://uses.tech/)
* [Ian Kilpatrick](https://www.linkedin.com/in/ian-kilpatrick-9b68a373/)
* [Jared Palmer's tsdx](https://github.com/jaredpalmer/tsdx)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets