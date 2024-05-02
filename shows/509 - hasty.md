---
number: 509
title: Use Next-gen CSS Today (Post CSS Configs)
date: 1662984000065
url: https://traffic.libsyn.com/syntax/Syntax_-_509.mp3
---

In this Hasty Treat, Scott and Wes talk about next generation CSS that you can use today with PostCSS including importing, nesting, variables, media query ranges, custom media queries, and more.

## Prismic - Sponsor

Prismic is a Headless CMS that makes it easy to build website pages as a set of components. Break pages into sections of components using React, Vue, or whatever you like. Make corresponding Slices in Prismic. Start building pages dynamically in minutes. Get started at [prismic.io/syntax](https://prismic.io/syntax).

## Sentry - Sponsor

If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Show Notes

* **[00:27](#t=00:27)** Welcome
* **[01:30](#t=01:30)** Sponsor: Prismic
* **[02:54](#t=02:54)** Sponsor: Sentry
* **[03:53](#t=03:53)** Do we use Post CSS?
* **[05:22](#t=05:22)** Presets and plugins
* **[06:19](#t=06:19)** Plugins we're using

```
"postcss-import"

@import './elements/headings.css';
```

* **[09:48](#t=09:48)** PostCSS Nested
* **[12:59](#t=12:59)** Variables (Custom Properties)
* **[15:50](#t=15:50)** Media Query Ranges
* [PostCSS Media Minmax](https://github.com/postcss/postcss-media-minmax)
* **[17:16](#t=17:16)** Custom Media Queries

```
"postcss-media-minmax"

@media screen and (width >= 500px) and (width <= 1200px)
```

```
"postcss-custom-media"

@custom-media --below_small (width < env(--small_bp));

@media (--above_small) {}
```

* **[18:35](#t=18:35)** Env Vars

```
"postcss-env-function"

env(--small_bp)
```

* **[20:12](#t=20:12)** Color Function and Color Function Notation

```
/* color-function */
p {
  color: color(display-p3 1 0.5 0);
  color: color(display-p3 1 0.5 0 / .5);
}
```

* [Syntax 479: CSS Color Functions](https://syntax.fm/show/479/css5-color-functions)
* [Post CSS Color Functional Notation](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-color-functional-notation#readme)
* [Post CSS Preset Env](https://github.com/csstools/postcss-plugins/blob/main/plugin-packs/postcss-preset-env/FEATURES.md )

## Tweet us your tasty treats

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
