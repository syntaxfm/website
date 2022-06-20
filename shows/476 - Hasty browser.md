---
number: 476
title: Browser CSS Page Transitions API aka Shared Element Transitions
date: 1656331200110
url: https://traffic.libsyn.com/secure/syntax/Syntax_-_476.mp3
---

In this Hasty Treat, Scott and Wes talk about the new Browser CSS Page Transitions API proposal and what features it opens up for developers on the web.

## Prismic - Sponsor

Prismic is a Headless CMS that makes it easy to build website pages as a set of components. Break pages into sections of components using React, Vue, or whatever you like. Make corresponding Slices in Prismic. Start building pages dynamically in minutes. Get started at [prismic.io/syntax](https://prismic.io/syntax).

## LogRocket - Sponsor

LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes

* WICG [Shared Element Transitions](https://github.com/WICG/shared-element-transitions/)

* **[00:21](#t=00:21)** Welcome
* **[01:33](#t=01:33)** Sponsor: Prismic
* **[02:43](#t=02:43)** Sponsor: LogRocket
* **[04:18](#t=04:18)** Browser animations on the web vs native apps
* **[06:15](#t=06:15)** What is the targeted use case for it?
* **[06:56](#t=06:56)** Shared Element to Root Transitions
* **[11:14](#t=11:14)** Entry and Exit
* **[17:33](#t=17:33)** How to enable this in Chrome
* [Example Code](https://github.com/WICG/shared-element-transitions/tree/main/sample-code)
* [Shared Element Transition history](https://css-tricks.com/shared-element-transitions/#aa-weird-history)
* [Sarah Drasner’s demo](https://twitter.com/sarah_edo/status/988414671232339970)

```
async function doTransition() {
  let transition = document.createDocumentTransition();
  
  // Specify offered elements. The tag below is used to refer
  // to the generated pseudo elemends in script/CSS.
  document.querySelector(".old-message").style.pageTransitionTag = "message";
  
  // The start() call triggers an async operation to capture
  // snapshots for the offered elements,
  await transition.start(async () => {
    // This callback is invoked by the browser when the capture
    // finishes and the DOM can be switched to the new state.
    // No frames are rendered until this callback returns.
    
    // Asynchronously load the new page.
    await coolFramework.changeTheDOMToPageB();
    
    // Clear the old message if that element is still in the page
    document.querySelector(".old-message").style.pageTransitionTag = "";
    // Set new message as the shared element 'message'
    document.querySelector(".new-message").style.pageTransitionTag = "message";
    
    // Set up animations using WA-API on the next frame.
    requestAnimationFrame(() => {
      document.documentElement.animate(keyframes, {
      ...animationOptions,
      pseudoElement: "::page-transition-container(message)",
      });
    });
    
    // Note that when this callback finishes, the animations will start with the tagged elements.
  });
}
```

## Tweet us your tasty treats

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
