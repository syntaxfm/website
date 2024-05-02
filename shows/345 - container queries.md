---
number: 345
title: Hasty Treat - Container Queries Are Here
date: 1618837200543
url: https://traffic.libsyn.com/syntax/Syntax345.mp3
---

In this Hasty Treat, Scott and Wes talk about CSS container queries, what they are and how to use them. 

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes
07:22 -  Why?
* Container queries are media queries for components (e.g. they are based on the element's size, not the browser).
* This is in line with how we write components.
* It will change the way we write CSS.

08:49 - The Syntax
* Containers need to be defined as containers via containment context

```css
.container {
  contain: size layout;
}
```

New contain value:

```css
.inline-container {
  contain: inline-size;
}
```

This is the same as the logical properties. Assuming you read LTR, or RTL:
* size - width and height
* inline-size = width
* block-size = height

```css
/* @container <container-query-list> { <stylesheet> } */
@container (inline-size > 45em) {
  .media-object {
    grid-template: "img content" auto / auto 1fr;
  }
}
```

18:49 - How to try them today
1. Download and/or update Chrome Canary
2. Go to chrome://flags
3. Search and enable "CSS Container Queries"
4. Restart the browser

19:27 - Demos
* Need Chrome Canary + Flag
* [https://codepen.io/collection/XQrgJo](https://codepen.io/collection/XQrgJo)
* [https://codepen.io/una/pen/LYbvKpK?editors=1100](https://codepen.io/una/pen/LYbvKpK?editors=1100)

## Links
* [Miriam Suzanne](https://www.miriamsuzanne.com/)
* [Susy](https://susy.oddbird.net/)
* [Miriam's CSS Sandbox](https://css.oddbird.net/)
* [https://css.oddbird.net/rwd/query/explainer/](https://css.oddbird.net/rwd/query/explainer/)
* [Canary](https://www.google.com/chrome/canary/)
* [@addyosmani](https://twitter.com/addyosmani)
* [The CSS Podcast](https://thecsspodcast.libsyn.com/)
* [@jon_neal](https://twitter.com/jon_neal)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets