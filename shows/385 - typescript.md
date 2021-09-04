---
number: 385
title: Hasty Treat - TypeScripts Strict Explained
date: 1630933200824
url: https://traffic.libsyn.com/syntax/Syntax385.mp3
---

In this Hasty Treat, Scott and Wes talk about the Typescript `strict` flag — what it does and why you might use it.

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes
02:50 - What is it?
* Future versions of TypeScript may introduce additional stricter checking under this flag, so upgrades of TypeScript might result in new type errors in your program. When appropriate and possible, a corresponding flag will be added to disable that behavior.

03:26 - `noImplicitAny`
* The `any` type in TypeScript is exactly that - it can be anything.
* TypeScript will try to `infer` the type. When it can't it will be `any`.
* Sometimes you need `any`, but if that is the case, you must explicitly type it as `any`.
* If something is implicitly `any` - it might be a mistake, or you forgot to type it. Risky!

06:01 - `noImplicitThis`
* You must type `this` - it can't be implicitly inferred.

06:47 - `strictFunctionTypes`
* If you have a type that is a function and it doesn't 100%.

07:44 - `alwaysStrict`
* Always turns on strict mode. You can't do things like redeclare `var` variables.

09:25 - `strictNullChecks`
* Makes you check that the item is actually there before accessing a value or method from it.
* Imagine you filter or find on an array, or query selector a DOM element. There is a possibility that nothing is there. `strictNullChecks` makes you check that it's there - like an if statement.
* Optional chaining is super handy here.

11:18 - `strictBindCallApply`

12:38 - `strictPropertyInitialization`

13:37 - `useUnknownInCatchVariables`

## Links
* [https://www.typescriptlang.org/tsconfig#strict](https://www.typescriptlang.org/tsconfig#strict) 

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets