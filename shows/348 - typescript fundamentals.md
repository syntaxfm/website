---
number: 348
title: TypeScript Fundamentals — Getting a Bit Deeper
date: 1619614800543
url: https://traffic.libsyn.com/syntax/Syntax348.mp3
---

In this episode of Syntax, Scott and Wes continue their discussion of TypeScript Fundamentals with a deeper diver into more advanced use cases. 

## Deque - Sponsor
Deque’s axe DevTools makes accessibility testing easy and doesn’t require special expertise. Find and fix issues while you code. Get started with a free trial of axe DevTools Pro at [deque.com/syntax](https://www.deque.com/syntax). No credit card needed.

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Mux - Sponsor
Mux Video is an API-first platform that makes it easy for any developer to build beautiful video. Powered by data and designed by video experts, your video will work perfectly on every device, every time. Mux Video handles storage, encoding, and delivery so you can focus on building your product. Live streaming is just as easy and Mux will scale with you as you grow, whether you're serving a few dozen streams or a few million. Visit [mux.com/syntax](https://mux.com/syntax).

## Show Notes

### Deep end stuff
03:30 - `any vs unknown`

06:20 - `never`
* [https://twitter.com/Igorbdsq/status/1351681019196436482](https://twitter.com/Igorbdsq/status/1351681019196436482)
09:14 - .d.ts
* Definition files
* Usually for existing libraries that don't have types
* Can be generated or hand-written
* Also really handy for pure JS projects, you still get good autocomplete because of these

13:25 - Type generation
* Can be generated from GraphQL, or Schemas, or from JSON Output

17:20 - TypeScript generics (variables)
* Kind of like functions, they return something different based on what you pass it
* makeFood<Sandwich>
* makeFood<Pizza>
* This function makes food and shares lots of the same functionality between making a pizza and sandwich
  * If the only thing that differs is the type returned, we can use generics
  * You often see this as a single char T
  * It can be anything
  * Promise is a generic
  * querySelector uses generics

21:48 - Promises / Async + Await
  * Functions now return a Promise type, but with a generic
  * Promise<number>
  * Promise<Course>
  * Promise<Request<Order>>, Request<Customer>, Request<Product>
    * stringified
    * added headers

29:48 - Type assertion (type casting)
  * Type assertion is when you want to tell TypeScript "Hey I know better than you".
  * Two ways:
    * as keyword (most popular)
      * `someValue as HTMLParagraphElement`
      * Tagged before
        * <HTMLParagraphElement>someValue

34:14 - TypeScript without TypeScript ([JSDoc](https://jsdoc.app/) / [TSDoc](https://tsdoc.org/))
* Really nice!
* You can also add comments / descriptions
* [https://github.com/developit/redaxios/blob/master/src/index.js](https://github.com/developit/redaxios/blob/master/src/index.js)

40:08 - Interfaces vs Types
* Interfaces have better perf
* [https://twitter.com/wesbos/status/1362418379919937545](https://twitter.com/wesbos/status/1362418379919937545)
* [https://blog.logrocket.com/types-vs-interfaces-in-typescript/](https://blog.logrocket.com/types-vs-interfaces-in-typescript/)
* What do you default to?

### How we write TypeScript
44:27 - Interface or Types
  * Scott - Types
  * Wes - Interfaces

44:50 - `any vs unknown`
* Scott - any
* Wes - unknown / any

46:52 - Any (No Implicit or Implicit Allowed)
* Scott - No implicit any
* Wes - No implicit any

48:31 - Return types (Implicit or Explicit)
* Scott - Explicit always
* Wes - Not always

50:49 - Compile (TSC, Strip TS)
* Scott - Strip
* Wes - Both

52:38 - Type Assertion (as or <tag>)
* Scott - as
* Wes - as

53:09 - Arrays (Dog[] or Array<Dog>)
* Scott - Dog[]
* Wes - Dog[]

54:02 - Assert or Generic (if both work)
* querySelector('.thing') as HTMLVideoElement; or querySelector<HTMLVideoElement>('.thing');
* Scott - querySelector<HTMLVideoElement>('.thing');
* Wes - querySelector<HTMLVideoElement>('.thing');

## Links
* [Syntax 324: TypeScript Fundamentals](https://syntax.fm/show/324/typescript-fundamentals)
* [Syntax 327: Hasty Treat - TypeScript Compilers and Build Tools](https://syntax.fm/show/327/hasty-treat-typescript-compilers-and-build-tools)
* [Axios](https://www.npmjs.com/package/axios)
* [VS Code](https://code.visualstudio.com/)
* [Syntax 310: Serverless, Deno and TypeScript with Brian Leroux](https://syntax.fm/show/310/serverless-deno-and-typescript-with-brian-leroux)
* [Cloudinary](https://cloudinary.com/)
* [Notion](https://www.notion.so/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Powerowl 16 Battery Recharger](https://amzn.to/3u9DlUx)
* Wes: [Fairywill Pro P11](https://amzn.to/3cxKdFf) 

## Shameless Plugs
* Scott: [Level 2 Node Authentication](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [Beginner Javascript](https://beginnerjavascript.com/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets