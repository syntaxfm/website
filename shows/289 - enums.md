---
number: 289
title: Hasty Treat - Enums in JS (GraphQL and Typescript)
date: 1601902800592
url: https://traffic.libsyn.com/syntax/Syntax289.mp3
---

In this Hasty Treat, Scott and Wes talk about enums in JS — what they are, what they do, and how they work in JavaScript. 

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes

03:11 - What are enums?
* A type restricting variables to one value from a predefined set of constants
* Direction = UP / DOWN / LEFT / RIGHT
* Role = ADMIN EDITOR AUTHOR VIEWER
* Day of the Week

05:12 - In GraphQL
* enum Role { ADMIN EDITOR AUTHOR VIEWER}
* Then

07:05 - In TypeScript
* First, declare the type:
  * enum direction = { UP, DOWN, LEFT, RIGHT }
* Then when you defined your function, use that type
  * type User { role: Role } or type User { role: [Role] } 

08:49 - In JavaScript
* Not in JS yet
* There is a proposal in stage 1
  * [https://github.com/rbuckton/proposal-enum](https://github.com/rbuckton/proposal-enum)
* And a babel plugin:
  * [https://www.npmjs.com/package/babel-plugin-const-enum](https://www.npmjs.com/package/babel-plugin-const-enum)
* Can use case/switch
* Can use Object or Map keys

## Links
* [Syntax 287: Hasty Treat - Records and Tuples in JavaScript](https://syntax.fm/show/287/hasty-treat-records-and-tuples-in-javascript)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets