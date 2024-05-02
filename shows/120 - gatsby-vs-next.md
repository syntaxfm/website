---
number: 120
title: Gatsby vs Next
date: 1550671200938
url: https://traffic.libsyn.com/syntax/Syntax120.mp3
---

In this episode, Wes and Scott debate Gatsby vs Next — how they compare, the pros and cons of each, why you might chose one over the other for your next project, and more!

## LogRocket - Sponsor

[LogRocket](https://logrocket.com/syntax) lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session replayer and a performance monitor. Get 14 days free at [https://logrocket.com/syntax](https://logrocket.com/syntax).

## The Armoury - Sponsor

The Armoury is a men's clothing and accessories retailer that provides some of the highest quality clothing you can buy. Designed for those of you who want the highest quality clothing that feels great and will last forever. Buy less, buy better. Follow them on Instagram [@thearmourynyc](https://www.instagram.com/thearmourynyc/) and check out their website [TheArmoury.com](https://thearmoury.com).

## Show Notes

5:07 - Server Side Rendering

* Next.js will render on demand — this allows you to have server rendered pages on demand.
  * Think of a blog website — publish a new blog post and it will immediately start working.
  * Authenticated pages can be server rendered, and thus, pre-loaded for better performance.
* Gatsby runs at build time only — so you need to have all of your data ready at build time.
  * Pro: This makes for very fast page load.
  * Con: Large websites can take a long time to build.
  * Con: Gatsby can do network fetches from the client, but these lose the benefit of SSR.
* Ease of SSR:
  * Next.js requires a complicated document.js file if you are fetching data anywhere other than a page component.
    * This will probably get easier with Suspense. Demos are simple, but any real application requires harder config.
  * Gatsby is Easy Peeezy!

11:09 - Data

* Next.js is unopinionated. Like React, it doesn't care where your data comes from.
  * getInitialProps();
* Gatsby has a number of "source" plugins which will pull in data from sources — markdown, WordPress, API, file system. Once you have that data sourced, you can query it with GraphQL.

22:50 - Routing and Creating Pages

* Next.js makes you create a page in a pages directory. You can nest these as deep as you like. If you want to pass query params, you must do so with a `?query=string`. There are several third-party options for getting around this that require a node server.
* Gatsby allows you to programmatically create pages with their createPage API.
* For both navigating between pages, they make a Link Component available.

30:49 - Plugins

* In Gatsby, *everything* goes through the Gatsby pipeline. This makes things like image compression, pagination, sass, service workers and many other progressive web app pieces very easy.
* Gatsby makes building a really good website easy.
* Gatsby Image is SOOOOO amazing.
* The scope of Next.js is much smaller. They give you a few things, but you generally bring your own approach for most things
  * Routing
  * Linking and prefetching
  * Dynamic Importing

38:42 - Deploying and Hosting

* Gatsby is just HTML, CSS, and JS at the end of the day, so it can be deployed almost anywhere — Netlify, Github Pages, cheap PHP hosting, etc.
* Next.js is a Node app. It can be integrated into an existing Express app, or run by itself. Requires a Node server to run it.
* Next.js has a static generation option, but you're better off using Gatsby for that.

44:41 - The verdict?

* Use Next.js for Apps, Gatsby for Websites

## Links

* [LogRocket](https://logrocket.com/syntax)
* [The Armoury](https://thearmoury.com/)
* [Next.js](https://nextjs.org/)
* [Gatsby](https://www.gatsbyjs.org/)
* [Netlify](https://www.netlify.com/)
* [Node](https://nodejs.org/en/)
* [Express](https://expressjs.com/)

## ××× SIIIIICK ××× PIIIICKS ×××

* Scott: [Motion LED Lights](https://amzn.to/2DtVNhO)
* Wes: [The Dream Podcast](https://www.thedream.fm/)

## Shameless Plugs

* [Scott's Pro Gatsby 2 Course](https://www.leveluptutorials.com/store/products/tutorials/lut-dd028)
* [Wes' Courses](https://www.wesbos.com/courses)

## Tweet us your tasty treats!

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
