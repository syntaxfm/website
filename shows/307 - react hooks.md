---
number: 307
title: Hasty Treat - Why should I use React Hooks?
date: 1607349600135
url: https://traffic.libsyn.com/syntax/Syntax307.mp3
---

In this Hasty Treat, Scott and Wes talk about React Hooks and why you might want to use them instead of class components.

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

03:54 - Decouple the UI from the logic
* This wasn't impossible with class-based components, but we started using HOC to do this.
* With hooks, it makes you decouple what it does and how it looks. 
* Makes things like GraphQL code gen possible
* Multiple pieces of state or functionality 
* Share commonly used functionality among projects and components

10:31 - Reduction in code
* Lifecycle methods were often redundant. useEffect offers a way to prevent the duplication that can happen with component did update and did mount. This gives you a way to say, "Hey, run this code when these things change."

13:30 - useEffect's dependencies
* These give you access to targeted control over side effects rather than just something changed.

14:15 - Easier to grok
* What happens? When? Where? It's mostly in the hook.

16:09 - Simplicity in usage
* Thing, updateThing is more targeted than set state
* Ref makes way more sense with useRef
  * String refs weren't great, the function ref thing was obnoxious

21:07 - Gripes about Hooks
* Naming is kind of odd
  * Vue did a better job with the names

## Links
* [https://github.com/pmndrs/jotai](https://github.com/pmndrs/jotai)
* [https://github.com/rehooks](https://github.com/rehooks)
* [https://twitter.com/youyuxi/status/1327328144525848577/photo/1](https://twitter.com/youyuxi/status/1327328144525848577/photo/1)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets