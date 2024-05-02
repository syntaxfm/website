---
number: 317
title: Hasty Treat - A Podcast About Nothing
date: 1610373600125
url: https://traffic.libsyn.com/syntax/Syntax317.mp3
---

In this Hasty Treat, Scott and Wes talk about nothing — null, undefined, void, false, 0, '', NaN, [], {}, never — all sorts of values that could mean the things that do not exist.

## Prismic - Sponsor
Prismic is a Headless CMS that makes it easy to build website pages as a set of components. Break pages into sections of components using React, Vue, or whatever you like. Make corresponding Slices in Prismic. Start building pages dynamically in minutes. Get started at [prismic.io/syntax](https://prismic.io/syntax).

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes
03:35 - Undefined 
* Implicitly nothing
* A variable declared, but not set is undefined

04:25 - Null
* Explicitly nothing

04:41 - Null vs Undefined
* Null has a value of nothing
* Undefined does not have a value
* You can set variables to either
  * If you want to set a score variable to nothing, set it to null
  * If you want to un-set a value, set it to undefined
  * == will check if a value is either null or undefined 

05:35 - Void 
* In Javascript
  * You can pop void in front of calling a function and it will return undefined (even if that function returns a value)
  * I've seen it on links that go nowhere (don't do this — use a button)
  * To prevent an arrow function from leaking
  * `onSubmit="javascript:void()"` is a quick-n-easy prevent default on forms
* In Typescript
  * Void is when you don’t care about what is returned from a function, or if nothing is returned
  * A click handler that goes off and does stuff (side effect) can return void

09:15 - Never (in Typescript)
* Some functions will never return:
  * Functions that throw errors
  * Functions that have infinite loops
  * Also, unreachable variables have a type of never
    * `if(true == false) { let var = 'this will never be true'; }`

11:05 - Falsy values
* 0, -0, 0n
* false
* '' (empty string)
* Empty array
  * Is a value
  * Its .length can be falsy
* Empty object
  * Is a value
  * Its object.keys(object) length can be falsy (0)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets