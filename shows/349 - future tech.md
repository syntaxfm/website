---
number: 349
title: Hasty Treat - Future Tech We're Excited About
date: 1620046800877
url: https://traffic.libsyn.com/syntax/Syntax349.mp3
---

In this Hasty Treat, Scott and Wes talk about future tech — some things you may not have heard about yet, and why we're excited about them!

## Freshbooks - Sponsor
Get a 30 day free trial of Freshbooks at [freshbooks.com/syntax](https://freshbooks.com/syntax) and put SYNTAX in the "How did you hear about us?" section.

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes
05:20 - Astro
* What it is:
  * [astro.build](http://astro.build) is a next gen "meta" framework that eases some of React's pain but also is not just React.
  * [https://twitter.com/georges_gomes/status/1380801812656226304](https://twitter.com/georges_gomes/status/1380801812656226304)
* Why we're excited about it:
  * Server Side JS frameworks, combine Svelte, React, Vue as needed in one component that is an SFC using markdown style meta data.
  * Scoped CSS by default (a la Svelte). Sass out of the box.
  * Collections import for .md files

```html
// pages/blog.astro
---
import PostPreview from '../components/PostPreview.astro';

const blogPosts = import.meta.collections('./post/*.md');
---

<main>
  <h1>Blog Posts</h1>
  {blogPosts.map((post) => (
    <PostPreview post={post} />
  )}
</main>
```

12:06 - ViteKit
* What it is:
  * Framework-agnostic
  * API routes
  * Pages (frontend, optional hydration)
  * Adapter for Node, static, Vercel, cf worker, etc. Inspired by SvelteKit.

15:58 - Svelte Kit
* What it is:
  * [https://kit.svelte.dev/docs](https://kit.svelte.dev/docs)
  * [https://svelte.dev/blog/sveltekit-beta](https://svelte.dev/blog/sveltekit-beta)
  * New framework for building Svelte apps

19:07 - Remix.run
* What it is:
  * [Remix.run](https://remix.run/)
  * Fullstack React framework
* Why we're excited about it:
  * Made by Michael Jackson, Ryan Florence
  * License-based
  * React-based
  * Caching-focused, uses "the platform"
  * Centralized data loading, works without client JS if needed
  * Better nested routing

## Links
* [Sapper](https://sapper.svelte.dev/)
* [Vite](https://vitejs.dev/)
* [Snowpack](https://www.snowpack.dev/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets