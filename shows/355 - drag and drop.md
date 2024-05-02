---
number: 355
title: Hasty Treat - JavaScript's Drag and Drop API
date: 1621861200010
url: https://traffic.libsyn.com/syntax/Syntax355.mp3
---

In this Hasty Treat, Scott and Wes talk about JavaScript's drag and drop API — how it works, concerns, best practices, and more!

## .TECH Domains - Sponsor
.TECH is taking the tech industry by storm. A domain that shows the world what you are all about! If you're looking for a domain name for your startup, portfolio, or your own project like we did with uses.tech, check out .tech Domains. Syntax listeners can snap their .TECH Domains at 80% off on five-year registration by visiting [go.tech/syntaxistech](https://go.tech/syntaxistech) and using the coupon code "syntax5".

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Show Notes
04:45 - What is it?
* Drag and drop is really for desktop apps
* You can drag and drop anything from any browser to any browser
* The important thing here is that this is a set of browser standards that allow different apps to communicate

07:50 - How to implement
1. Make an element draggable
2. Listen on elements for drag events
    * The events bubble up, so you can listen on the parent element as items are added/removed

09:06 - DataTransfer API
* You can store anything you want in it
* getData / setData API 
* Reference strings

11:35 - Accepting drops
* When you dragOver, you need to preventDefault()
* Calling the preventDefault() method during both a dragEnter and dragOver event will indicate that a drop is allowed at that location

13:01 - Drop Image
* Set whatever you want

16:00 - Drop Effect
* What does it look like when you drop it? Does it go back?
* dataTransfer.effectAllowed
* e.dataTransfer.setDragImage(nothing, 0, 0);

18:02 - Security concerns

20:34 - Shortcomings:
* Edge cases out the WAZOO
  * Margin caused dragout events
  * Lots of if statements
* It's up to you to do EVERYTHING
  * CSS, classes, hover styles, etc.
* Accessibility
  * Inaccessible by default, unless using mouse keys
  * Have to announce everything
* Mobile

26:14 - Lbs 
* [Transmat API](https://google.github.io/transmat/)

## Links
* [Figma](https://www.figma.com/)
* [Notion](https://www.notion.so/)
* [Missive](https://missiveapp.com/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets