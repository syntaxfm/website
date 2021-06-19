---
number: 353
title: Hasty Treat - Stylin the Unstylables
date: 1621256400177
url: https://traffic.libsyn.com/syntax/Syntax353.mp3
---

In this Hasty Treat, Scott and Wes talk about the different kinds of things that are difficult to style, how you can style them, and some future tech to look out for!

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes
### Can it be styled? Solutions
04:28 - Just style the defaults
* Most elements can be styled, though some elements are really just multiple elements grouped together into the shadow dom and are hard to style.
* This leads to us having to re-create the visual UI, and often is a point of making inaccessible UIs.
* Select
* Input - number, date, etc.
  * Very hard to style
  * Often need `appearance: none;` for mobile
* Checkbox / Radio
* Generally speaking, these CSS Properties can be applied to all inputs:
  * font-size
  * color
  * padding
  * margin
  * background / images
  * outline (remember focus)
  * border

08:20 - Overlap with more dom elements, set background images
* Checkbox / Radio / Toggle buttons
  * Often used `:before` and `:after` along with labels — e.g. label + input:checked
* Select can have element overlap

14:13 - Re-implement the UI with JavaScript
* Video / Audio
  * HUGE rabbit hole of things to code
* Very important to maintain accessibility

15:46 - Use a UI Library
* [Bootstrap](https://getbootstrap.com/)
* [Foundation](https://get.foundation/)
* [Ant Design](https://ant.design/)
* [Carbon Design](https://www.carbondesignsystem.com/)
* [Fast](https://www.fast.design/)
* [Lightning Design System](https://www.lightningdesignsystem.com/)
* [Material Design](https://material.io/design)
* [Chakra](https://chakra-ui.com/)

17:20 - Open UI
* Documenting all the different types of web UI controls
* [https://open-ui.org/](https://open-ui.org/)
* [https://twitter.com/stubbornella/status/1384889551924121605](https://twitter.com/stubbornella/status/1384889551924121605)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets