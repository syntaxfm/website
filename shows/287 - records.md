---
number: 287
title: Hasty Treat - Records and Tuples in JavaScript
date: 1601298000368
url: https://traffic.libsyn.com/syntax/Syntax287.mp3
---

In this Hasty Treat, Scott and Wes talk about records and tuples in javascript — what they are, why you might want to use them, and more!

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes

???? - 

02:42 - Immutability

05:08 - Records
* Immutable object
* Syntax `#{x: 1, y: 2}`

05:56 - Tuples
* Immutable array
* Syntax `#[1,2,3,4]`

07:18 - For both
* Referred to as a compound primitive
* Can contain only primitives, not objects
* They are compared deeply by their contents rather than their identity

    ```jsx
    assert(#{ a: 1 } === #{ a: 1 });
    assert(#[1, 2] === #[1, 2]);
    assert(#{ a: 1, b: 2 } === #{ b: 2, a: 1 });
    ```

* Potential for optimizations
  * Optimizations for making deep equality checks fast
  * Optimizations for manipulating data structures
* Works well with type systems
* Better integration with the debugger
* Accessed through normal record.scott object like syntax

13:39 - Stage 2

## Links
* [https://github.com/tc39/proposal-record-tuple](https://github.com/tc39/proposal-record-tuple)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets