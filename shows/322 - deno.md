---
number: 322
title: The Deno Show
date: 1611756000813
url: https://traffic.libsyn.com/syntax/Syntax322.mp3
---

In this episode of Syntax, Scott and Wes bring you the long-awaited Deno show — what it is, what it replaces, how you can use it, and more!

## Deque - Sponsor
Deque’s free axe browser extension helps developers instantly catch 50% of accessibility bugs while they code. It’s lightweight, easy-to-use, and has zero false positives. Get started for free at [deque.com/axe](https://deque.com/axe/?utm_source=syntax&utm_medium=podcast&utm_campaign=axe_extension).

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code TASTYTREAT during sign up.

## Mux - Sponsor
Mux Video is an API-first platform that makes it easy for any developer to build beautiful video. Powered by data and designed by video experts, your video will work perfectly on every device, every time. Mux Video handles storage, encoding, and delivery so you can focus on building your product. Live streaming is just as easy and Mux will scale with you as you grow, whether you're serving a few dozen streams or a few million. Visit [mux.com/syntax](https://mux.com/syntax).

## Show Notes
02:13 - What is it?
* A secure runtime for JavaScript and TypeScript
* Built by [Ryan Dhal](https://tinyclouds.org/) — same guy who initially built Node.js
* API is JS or TS out of the box

04:55 - Does it replace / what is it in relation to?
* Node
    * It's a replacement for Node.js
* Express
    * Web Server Frameworks like Express will run on Deno, but Express itself won't currently run because they are build on Node APIs
    * [https://github.com/oakserver/oak](https://github.com/oakserver/oak)
* Serverless
    * Deno can be used for anything, so it can be used for serverless functions, or a traditional web server
    * [Serverless, Deno and TypeScript with Brian Leroux](https://syntax.fm/show/310/serverless-deno-and-typescript-with-brian-leroux)
* React / Vue / Svelte
    * These things are just JavaScript, so they should/will work in Deno. Deno will replace your tooling. More involved things like Next.js that require Node APIs won't work until.
    * [https://alephjs.org/](https://alephjs.org/)
* SSR
    * It comes with all browser APIs out of the box!
* Fetch
    * Window + Add Event listener
* Webpack / Parcel / Snowpack
    * Deno is a bundler
* Prettier
    * Deno is a formatter
* TSC
    * Deno is a TypeScript compiler and runtime
* ESLint
    * Deno is a linter
* Jest
    * Deno is a Test Runner
* NPM
    * Deno is a package manager - it pulls in packages from URLs

14:51 - Modules
* ES modules from the start
* Modules are loaded from URLs
* Why? No package registry to worry about
* This is how the browser works
* Import from URL
* You can also specify it in the json file
* [https://github.com/oakserver/oak/blob/main/deps.ts](https://github.com/oakserver/oak/blob/main/deps.ts)
* [https://deno.land/](https://deno.land/)
* Fetch is built in!
    * It's a browser API, but who cares?!
* Browser APIs
    * window.add event Listener
    * Deno is event based, like the browser

20:10 - A nice standard library
* [https://github.com/denoland/deno_std](https://github.com/denoland/deno_std)

22:14 - WASM
* Deno can run WASM with the same APIs that the browsers can
* Node is doing this too (experimental)

25:06 - Multi-threading with Web Workers

26:13 - Speed
* It's fast!
* They took everything they learned from Node - good and bad
* Built in Rust
* From what we understand:
    * V8 is written in C++
    * Node is written in C, C++ and JavaScript
    * How it talks to V8 - Rust sits in-between the JS runtime, and the C++ V8 runtime and communicates between the two.
    * [https://github.com/denoland/deno/blob/master/core/examples/hello_world.rs](https://github.com/denoland/deno/blob/master/core/examples/hello_world.rs)

29:44 - Security
* Sandboxed
* —allow-read
* —allow-net
* -allow-write
* [https://deno.land/manual@v1.6.3/getting_started/permissions#permissions-list](https://deno.land/manual@v1.6.3/getting_started/permissions#permissions-list)
* You can specify which dirs it can access

33:39 - Run from anywhere
* [https://www.npmjs.com/package/npx](https://www.npmjs.com/package/npx)
* Deno run https://cool.com/whatever.ts

37:43 - Async out of the box
* Everything is based on async + await / promises right away. No callback APIs, no promise wrapping.
* Top level await

38:53 - Node Compatibility
* Node APIs are being filled
* This means if a browser package ships an ES module of a package, we can just import it

42:21 - What we've built
* A bunch of sample scripts
* Lots of simple demos
* Very intuitive
* Fetched and downloaded every single Syntax mp3
    * [https://twitter.com/wesbos/status/1326345600141582336](https://twitter.com/wesbos/status/1326345600141582336)

46:54 - Hosting
* Literally any linux server (Linode, Digital Ocean, etc.)
* [https://begin.com/](https://begin.com/)
* [https://fly.io/](https://fly.io/)

48:29 - Final thoughts
* Scott: Now is a great time to learn, but don't put any crucial work into that space unless you are ready to write everything. Libraries are still being written and evolved. Docs are still sparse. Many things didn't work on first try. I had to read lots of source.
* Wes: If You know JS or TS, you are already 90% there.
    * The package ecosystem isn't there yet
    * Battle-tested

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Boom/Bust: The Rise and Fall of HQ Trivia](https://www.theringer.com/2020/5/14/21258631/introducing-boom-bust-the-rise-and-fall-of-hq-trivia)
* Wes: [Orthopaedic Pillow](https://amzn.to/2Xc3WBH)

## Shameless Plugs
* Scott: [Deno 101 For Web Developers](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [All Courses](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
