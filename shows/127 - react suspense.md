---
number: 127
title: Hasty Treat - React Suspense
date: 1552914000479
url: https://traffic.libsyn.com/syntax/Syntax127.mp3
---

In this Hasty Treat, Scott and Wes talk about React Suspense — what it is, how it works, support and more!

## Sentry - Sponsor

If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

Not live yet - it may/will change. Be warned! 

3:59 - The problem we have with React right now

  * API calls
  * Image loading
  * Code splitting

7:16 - What is React Suspense?

1. First we convert our async data fetching functions into **resources**
2. Resources can then be read inside render - above the return
3. Resources can be read from cache
4. Resources can be preloaded into a cache if you anticipate needing them
5. Resources reads are blocking for that function - you can't return JSX until the resource is read
6. In your component that fetches data, there is no need to maintain a loading state
7. Then, anywhere higher up in that tree, you can introduce a suspense component
8. The suspense component can **detect** if any of it's children are currently loading data
9. If they are, we can then choose to show a loader via the **fallback** prop
10. We can also choose to **show nothing via the maxDelay prop** — this is helpful for fast connections that shouldn't see the spinner for a short split-second

15:20 - Support

* React.lazy and suspense for code splitting is already here
* The React.lazy function lets you render a dynamic import as a regular component
* Loadable Components is recommended if you need splitting with SSR
* Data Resources is not here yet

## Links
* [React 16.x Roadmap](https://reactjs.org/blog/2018/11/27/react-16-roadmap.html#react-16x-mid-2019-the-one-with-suspense-for-data-fetching)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets