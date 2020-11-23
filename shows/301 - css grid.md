---
number: 301
title: Hasty Treat - CSS Grid Masonry (Grid Level 3)
date: 1605535200919
url: https://traffic.libsyn.com/syntax/Syntax301.mp3
---

In this Hasty Treat, Scott and Wes talk about CSS Grid Level 3 — why it's such a cool thing and why they've been waiting for it for so long.

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes

04:33 - The spec
* [https://drafts.csswg.org/css-grid-3/](https://drafts.csswg.org/css-grid-3/)
* [https://twitter.com/wesbos/status/1320735900343668738](https://twitter.com/wesbos/status/1320735900343668738)

06:10 - How it works
* `masonry-auto-flow: next;`
  1. It first puts all the items that are explicitly placed onto the grid. Items that you have a set start/stop value for are first put down.
  2. Then it takes the next item that it to be placed and finds a spot for it. This is different because with CSS Grid you normally have to place the next item on the next row or column.
  3. `grid-template-columns` and `grid-template-rows` can now be marked as masonry and this specifies which axis will be masonry.

09:06 - The implicit grid
* [https://drafts.csswg.org/css-grid-3/#%23implicit-grid](https://drafts.csswg.org/css-grid-3/#%23implicit-grid)
* The implicit grid is formed in the same way as a regular grid container. However, it’s only used in the grid axis.
* Interesting in a column situation (see images).

13:25 - Thoughts
* Power tools for layout in CSS — opens up a ton of possibilities and completes the functionality we use to dream of in CSS.

## Links
* [David DeSandro](https://desandro.com/)
* [https://metafizzy.co/](https://metafizzy.co/)
* [Chris Coyier](https://chriscoyier.net/)
* [https://caniuse.com/](https://caniuse.com/)
* [Isotope](https://isotope.metafizzy.co/)
* [Flickity](https://flickity.metafizzy.co/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets