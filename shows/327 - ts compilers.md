---
number: 327
title: Hasty Treat - TypeScript Compilers and Build Tools
date: 1613397600264
url: https://traffic.libsyn.com/syntax/Syntax327.mp3
---

In this Hasty Treat, Scott and Wes talk about the differences between compilers and build tools in TypeScript.

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes
03:38 - What is a TypeScript compiler?
* Do we still need [Babel](https://babeljs.io/) / [WebPack](https://webpack.js.org/)? 

07:49 - [Babel](https://babeljs.io/)
* Transpiler
* It doesn't do typechecking
* New JS features that aren't in TypeScript yet

10:22 - [SWC](https://swc.rs/) 
* Rust based compiler
* Doesn't do type checking (yet)
* [https://github.com/swc-project/swc/issues/571](https://github.com/swc-project/swc/issues/571)

13:03 - [Deno](https://deno.land/)
* Uses tsc right now
* Might move to Rust
* [https://github.com/denoland/deno/issues/5432](https://github.com/denoland/deno/issues/5432)

13:36 - [Surcase](https://github.com/alangpierce/sucrase) 
* [https://github.com/alangpierce/sucrase#transforms](https://github.com/alangpierce/sucrase#transforms) 

14:46 - [ESBuild](https://esbuild.github.io/)
* Compiles, but doesn't do any type checking
* Fastest

17:39 - What about bundlers?
* [Parcel](https://parceljs.org/)
* [Snowpack](https://www.snowpack.dev/)
* [Webpack](https://webpack.js.org/)
* [ESBuild](https://esbuild.github.io/)
* When might you still need a bundler?
  * To handle different types of files that are non-standard
    * Like importing CSS and images
* Treeshaking
* Smaller bundle files
  * Typescript can concatenate to a single file, or all .js files, but smaller / smarter bundles still need a tool for that
* Polyfills
  * Typescript does convert to syntax, but will not polyfill features
  * Something like Promise
    * Syntax can be transpiled to old code
    * Methods like allSettled aren't

## Links
* [Syntax 324: TypeScript Fundamentals](https://syntax.fm/show/324/typescript-fundamentals)
* [Syntax 322: The Deno Show](https://syntax.fm/show/322/the-deno-show)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets