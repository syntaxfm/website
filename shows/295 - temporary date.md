---
number: 295
title: Hasty Treat - Temporal Date Objects in JavaScript 
date: 1603717200713
url: https://traffic.libsyn.com/syntax/Syntax295.mp3
---

In this Hasty Treat, Scott and Wes talk about Temporal Date Objects in JavaScript — a WICKED AWESOME API for working with times and dates.

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

05:11 - Temporal Now
* You can get now
  * `Temporal.now.___`

07:58 - Temporal Instants
* A `Temporal.Instant` represents a fixed point in time, without regard to calendar or location.
  * Most common way to show it is nanoseconds since unix epoch.
  * Can be formatted a few different ways.

09:59 - Calendar
* Support for different types of calendars

11:43 - Durations
* Temporal.Duration
  * There are .from and .add and subtract() methods

12:47 - Other interesting parts
* Timezones
  * Temporal.ZonedDateTime
* Temporal.YearMonth - represents a ym = new Temporal.YearMonth(2019, 6) // => 2019-06

14:51 - Polyfill (unstable)

## Links
* [Fixing JavaScrip Date - Maggie Pint](https://maggiepint.com/2017/04/09/fixing-javascript-date-getting-started/)
* [https://github.com/tc39/proposal-temporal](https://github.com/tc39/proposal-temporal)
* [https://github.com/tc39/proposal-temporal/blob/main/docs/calendar.md#methods](https://github.com/tc39/proposal-temporal/blob/main/docs/calendar.md#methods)
* [https://github.com/tc39/proposal-temporal/blob/main/docs/duration.md](https://github.com/tc39/proposal-temporal/blob/main/docs/duration.md)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets