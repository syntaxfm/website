---
number: 403
title: Hasty Treat - What's the deal with Astro?
date: 1636380000049
url: https://traffic.libsyn.com/syntax/Syntax403.mp3
---

In this Hasty Treat, Scott and Wes talk about Astro — what it is and why you should check it out!

## Linode - Sponsor
Whether you’re working on a personal project or managing enterprise infrastructure, you deserve simple, affordable, and accessible cloud computing solutions that allow you to take your project to the next level. Simplify your cloud infrastructure with Linode’s Linux virtual machines and develop, deploy, and scale your modern applications faster and easier. Get started on Linode today with a $100 in free credit for listeners of Syntax. You can find all the details at [linode.com/syntax](https://linode.com/syntax). Linode has 11 global data centers and provides 24/7/365 human support with no tiers or hand-offs regardless of your plan size. In addition to shared and dedicated compute instances, you can use your $100 in credit on S3-compatible object storage, Managed Kubernetes, and more. Visit [linode.com/syntax](https://linode.com/syntax) and click on the “Create Free Account” button to get started.

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Show Notes
03:08 - What is it, what does it do?
* Framework for server-first static apps
* Use any front-end framework
* Does not ship JS unless you explicitly define a component to ship JS

05:20 - The syntax
* .astro files is a mash-up of Svelte and React
* Frontmatter for server-side JS
* Template syntax is basically JSX
* TS baked in

```html
<!-- Hydrates on load -->
<!-- <Test client:load  /> -->

<!-- Hydrates after main thread is free -->
<!-- <Test client:idle  /> -->

<!-- Hydrates as it's in viewport aka LazyLoading-->
<!-- <Test client:visible  /> -->

<!-- Hydrate when matching media query -->
<!-- <Test client:media={'(max-width: 600px)'}  /> -->

<!-- Only renders on the client -->
<!-- <Test client:only  /> -->
```

07:48 - State management
* In client-side JS only, no state in .astro files

10:50 - CSS 
* Svelte style
* Local, scoped <style> tags
* SCSS baked in

11:16 - Data fetching
* Fetch in frontmatter via fetch()

12:06 - Vs React? Vs Next? Vs Gatsby? Vs Svelte?

15:24 - Tooling
* There is a Syntax highlighter
* Uses Snowpack under the hood

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets