---
number: 362
title: CSS Container Queries, Layers, Scoping and More with Miriam Suzanne
date: 1623848400113
url: https://traffic.libsyn.com/syntax/Syntax362.mp3
---

In this episode of Syntax, Scott and Wes talk with Miriam Suzanne about all things CSS — container queries, layers, scoping, and more!

## Prismic - Sponsor
Prismic is a Headless CMS that makes it easy to build website pages as a set of components. Break pages into sections of components using React, Vue, or whatever you like. Make corresponding Slices in Prismic. Start building pages dynamically in minutes. Get started at [prismic.io/syntax](https://prismic.io/syntax).

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## RevenueCat - Sponsor
RevenueCat makes it easy to build and manage iOS and Android in-app purchases. With a few lines of code, RevenueCat provides IAP infrastructure, customer analytics, data integrations, and gives you time back from dealing with edge cases and updates across the platforms. Created by developers, for developers, thousands of the world’s best apps use RevenueCat to power their in-app purchases and subscriptions. Get started for free at [revenuecat.com](https://www.revenuecat.com).

## Guests
* [Miriam Suzanne](https://www.miriamsuzanne.com/)

## Show Notes
02:21 - When did you come on board with container queries?

10:27 - How would you declare specificity?
* Layer example:
```jsx
@layer default;
@layer theme;
@layer components;

@import url(theme.css) layer(theme);

@layer default {
  audio[controls] {
    display: block;
  }
}
```

13:08 - What is your background?

18:20 - What are container queries?

22:06 - What is the background on contain? How does it work?
* [https://developer.mozilla.org/en-US/docs/Web/CSS/contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain)

29:25 - Is it still under development?
* [https://www.igalia.com/open-prioritization/index](https://www.igalia.com/open-prioritization/index)

33:51 - Have you tried the EQ polyfill from Johnathan Neal yet? 

35:21 - How far out are we? 

38:10 - What is Scope?

44:00 - How will MQ and CQ work together?

45:49 - Do you use inline and block?

48:44 - What browser do you use?

## Links
* [OddBird](https://www.oddbird.net/)
* [Susy](https://www.miriamsuzanne.com/projects/susy/)
* [Jonathan Neal](https://jonneal.dev/)
* [FireFox](https://www.mozilla.org/en-US/firefox/new/)
* [Codepen](https://codepen.io/)
* [https://github.com/w3c/csswg-drafts](https://github.com/w3c/csswg-drafts) 
* [https://twitter.com/TerribleMia](https://twitter.com/TerribleMia)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Reelgood](https://reelgood.com/)
* Wes: [Embroidery machine](https://www.brother-usa.com/products/se600)

## Shameless Plugs
* Miriam: [OddBird](https://www.oddbird.net/)
* Scott:
  * 1: [SvelteKit](https://www.leveluptutorials.com/pro)
  * 2: [Level Up Tutorials Pro Spring Sale](https://www.leveluptutorials.com/pro) - 50% off annual subscriptions!
* Wes: [All Courses](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets