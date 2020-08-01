---
number: 271
title: Hasty Treat - Upgrading Next.js Syntax Site
date: 1596459600595
url: https://traffic.libsyn.com/syntax/Syntax271.mp3
---

In this Hasty Treat, Scott and Wes talk about their experience upgrading Syntax.fm and some of the site's big changes. 

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes

02:26 - The old Syntax site

* Next.js
* Custom server for
  * API - shows, Latest shows, sick picks
  * On-demand page builds
  * Custom routing

06:41 - The new Syntax site

* Next.js has solved those things now, no need for a custom server. 
  * API Routes
  * On-demand page builds: SSG with Next.js. It's a server, but caches the page builds. Releasing the shows happens with revalidation. It's statically generated like Gatsby, but you can also choose 
  * Custom routing is now done with [pages]
* Very fast to load
* Very fast to build
* Very fast to deploy
* It's now a "dynamic static site"
* Zeit Now 1 to "Vercel"
* Huge thanks to [Tim Neutkens](https://twitter.com/timneutkens) and [Luis Alvarez](https://twitter.com/luis_fades) from Vercel for making it happen.

13:23 - Why not:

* Gatsby
  * Entire site would need to be regenerated exactly at 9am eastern
  * API of the site would need to be done with something else like Netlify Functions - not nearly as nice as Next API routes
* Sapper

## Links
* [Next.js](https://nextjs.org/)
* [Gatsby](https://www.gatsbyjs.org/)
* [Sapper](https://sapper.svelte.dev/)
* [Vercel](https://vercel.com/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets