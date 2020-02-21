---
number: 151
title: Hasty Treat - Std Lib in JavaScript
date: 1560171600514
url: https://traffic.libsyn.com/syntax/Syntax151.mp3
---

In this Hasty Treat, Scott and Wes discuss the Javascript standard library proposal — what it is, how it could influence dev, and what they'd like to see.

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

1:38 - What is a Standard Lib? 

* Still experimental
* Built-in modules don't have to be downloaded because they ship with the browser
* Not exposing built-in modules globally has a lot of advantages:
	* They won't add any overhead to starting up a new JavaScript runtime context (e.g. a new tab, worker, or service worker)
	* They won't consume any memory or CPU unless they're actually imported
	* They don't run the risk of naming collisions with other variables defined in your code

6:47 - Key Value Storage is the first one: 

* [KV Storage: the Web's First Built-in Module](https://developers.google.com/web/updates/2019/03/kv-storage)

8:36 - What do we want to see? 

* Deep clone
    * Basically all of Lodash
* `util.isDeepScrictEqual`
* `Async json.parse()` / `json.stringify`
* UUID
* URL Lib for building and parsing URLs
* Missing Array Methods
    * Most of underscore JS

15:53 - International

* Currency Formatting
* Lists
* DateTimeFormat
* RelativeTimeFormat

## Links
* [JavaScript Standard Library Proposal](https://github.com/tc39/proposal-javascript-standard-library)
* [Add remaining Underscore / Lodash features](https://github.com/tc39/proposal-javascript-standard-library/issues/38)
* [JavaScript standard library contents](https://github.com/tc39/proposal-javascript-standard-library/issues/16#issuecomment-449089197)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets