---
number: 497
title: CSS Proposals @when, CSS Masonry, Carets
date: 1660564800137
url: https://traffic.libsyn.com/syntax/Syntax_-_497.mp3
spotify_url: https://open.spotify.com/episode/3mK9fVTtgp7voZQUnXQFOM
---

In this episode of Syntax, Wes and Scott talk about proposals to CSS including @when, CSS Masonry, CSS Caret, ENV Vars, and Media Query Ranges.

## Sentry  - Sponsor

If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Sanity - Sponsor

Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## Show Notes

* **[00:11](#t=00:11)** Welcome
* **[00:58](#t=00:58)** Sponsor: Sentry
* **[02:17](#t=02:17)** Sponsor: Sanity
* **[03:32](#t=03:32)** CSS @when and @else
* [CSS When and Else](https://www.w3.org/TR/css-conditional-5/#when-rule)

```
@when media(width >= 400px) and media(pointer: fine) and supports(display: flex) {
  /* A */
} @else supports(caret-color: pink) and supports(background: double-rainbow()) {
  /* B */
} @else {
  /* C */
}
```

* **[05:42](#t=05:42)** CSS Grid 3 Masonry
* [CSS Grid](https://drafts.csswg.org/css-grid-3/)

```
.grid {
  display: inline-grid;
  grid: masonry / repeat(3, 2ch);
  border: 1px solid;
  masonry-auto-flow: next;
}
```

* [David Desandro](https://desandro.com)
* [Rachel Andrew](https://rachelandrew.co.uk)
* **[09:00](#t=09:00)** CSS Caret
* [CSS Caret](https://www.w3.org/TR/css-ui-4/#insertion-caret)
* **[10:32](#t=10:32)** CSS Nesting
* [CSS Nesting](https://www.w3.org/TR/css-nesting-1/)
* [Syntax 343 CSS Nesting](https://syntax.fm/show/343/hasty-treat-css-nesting-1)
* [Postcss-preset-env](https://github.com/csstools/postcss-preset-env)
* **[13:14](#t=13:14)** ENV Vars
* [ENV Variables](https://drafts.csswg.org/css-env-1/)
* **[14:58](#t=14:58)** Media Query Ranges
* [MDN Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries#syntax_improvements_in_level_4)
`@media (width < env(--small_bp));`
`@media (100px < width < 1000px);`

## Tweet us your tasty treats

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
