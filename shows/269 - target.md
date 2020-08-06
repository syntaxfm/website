---
number: 269
title: Hasty Treat - Target=_blank security issue? What's the deal with noopener and noreferrer?
date: 1595854800426
url: https://traffic.libsyn.com/syntax/Syntax269.mp3
---

In this Hasty Treat, Scott and Wes talk about noopener and noreferrer and why you should use them with links that have blank targets.

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

03:35 - What's the big deal?

* If you have a link that is target="_blank" you should add rel="noopener" and rel="noreferrer"
* Retail Me Not uses it
* Valid use cases:
  * Same domain change the page from a popup
  * Cross domain changing page data
* Example: [https://mathiasbynens.github.io/rel-noopener/](https://mathiasbynens.github.io/rel-noopener/)

05:39 - Why doesn't the browser just fix it?

* Safari did - You can use rel="opener" to allow it
* Firefox did
* Chrome hasn't yet
* [https://twitter.com/HugoGiraudel/status/801475801397030912](https://twitter.com/HugoGiraudel/status/801475801397030912)

10:48 - Does this hurt SEO?

* It breaks analytics of the recipient site, turning a referral visit from your site into direct traffic, unless the link has UTM or similar tracking parameters. If you have a site where passing traffic offsite is part of the business model, links need an affiliate id instead.

## Links
* [@argyleink](https://twitter.com/argyleink)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
