---
number: 377
title: Hasty Treat - TypeScript Utility Types
date: 1628514000325
url: https://traffic.libsyn.com/syntax/Syntax377.mp3
---

In this Hasty Treat, Scott and Wes talk about TypeScript utility types — what they are, why you might use them, why they exist, and more!

## Linode - Sponsor
Whether you’re working on a personal project or managing enterprise infrastructure, you deserve simple, affordable, and accessible cloud computing solutions that allow you to take your project to the next level. Simplify your cloud infrastructure with Linode’s Linux virtual machines and develop, deploy, and scale your modern applications faster and easier. Get started on Linode today with a $100 in free credit for listeners of Syntax. You can find all the details at [linode.com/syntax](https://linode.com/syntax). Linode has 11 global data centers and provides 24/7/365 human support with no tiers or hand-offs regardless of your plan size. In addition to shared and dedicated compute instances, you can use your $100 in credit on S3-compatible object storage, Managed Kubernetes, and more. Visit [linode.com/syntax](https://linode.com/syntax) and click on the “Create Free Account” button to get started.

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes
03:35 - Levels of using TypeScript
1. Typing your code
2. Typing your code, but getting a little bit more dynamic using utility types
3. Creating your own utility types!
* TypeScript is a language in itself
* Check out type challenges if you want your mind blown: [https://github.com/type-challenges/type-challenges/](https://github.com/type-challenges/type-challenges/)
* [https://www.typescriptlang.org/docs/handbook/utility-types.html](https://www.typescriptlang.org/docs/handbook/utility-types.html)

07:29 - Partial

08:23 - ReadOnly

09:00 - Required

09:33 - Record
* A record is an object type that is a bit more restrictive
* Say you want to store podcast details - name, URL, showCount, etc., but only for Syntax and Shoptalk.

10:47 - Omit
* I find this one handy when I want to create a "Create Item" type, where it has all the item fields except the ID field

11:34 - Pick
* Given a type, pick these properties 

12:39 - Return Types
* Gives you the type that is returned from a function. Handy if you need to dynamically generate the type based on a passed function.

13:30 - Case
* These case types are useful for when you are doing template literal types
* `Uppercase<StringType>`
* `Lowercase<StringType>`
* `Capitalize<StringType>`
* `Uncapitalize<StringType>`

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets