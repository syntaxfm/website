---
number: 324
title: TypeScript Fundamentals
date: 1612360800858
url: https://traffic.libsyn.com/syntax/Syntax324.mp3
---

In this episode of Syntax, Scott and Wes talk about TypeScript fundamentals — what it is, how you use it, why people love it so much, and more!

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Cloudinary - Sponsor
[Cloudinary](https://cloudinary.com/?utm_source=Syntax.fm&utm_medium=Podcast&utm_content=Cloudinary_Syntax_podcast) is the best way to host, compress and transform your images on the web. Sign up for their free tier and get 10GB of bandwidth for free!

## Show Notes

### What is TypeScript?
03:12 - Types?
* What are types and why should you care?
* JS is a typed language, it's just not strongly typed
  * JS does not care about reassignment of a variable to a new type
  * Does not care about your types, but they do exist

06:34 - The Fundamentals
* You write your JavaScript code, but each time you create a variable, function, parameter, you "type it" — which means you describe what that data will look like.
  * Create a variable: Will it be a string? A number? A custom type of show?
  * Create a function: What params does it take? What type are they? What does it return?
* Types allow your code to know if there are type errors that would present themselves to the user silently. These are small errors that can be compounded and go unnoticed. 
  * This can allow you to prevent shipping code that has these errors by checking your code.
  * Some of the biggest benefits here come via errors in your text editor 

13:30 - Explaining the types
* You can create your own types
* Strings
* Numbers
  * We only have numbers in TS, no floats/ints
  * We do have BigInt though, but not something most people will use
* Arrays
  * Will be a list of another type
* Unions
  * This type will be one of the possible options
  * String of DRAFT PUBLISHED or ARCHIVED
* Intersections
  * An intersection type combines multiple types into one
* Objects
  * These are custom types where each property is its own type
* Any
  * Explicit any
  * Implicit any
* Language types
  * These things are technically just Objects, but they have their own types
  * Dates
  * Timeouts
  * DOM Elements / Nodes
* Void
  * When a function returns nothing — usually used with side effects like click handlers
* Enum
  * A set of named constants
    * Used when you have a select amount of values — I like to think of these as the select lists of TS
    * String unions are also used for this same thing

30:28 - Inference
* Automatic detection of types
* Typescript will try to infer your types based on their definition
* Not every type can be inferred, leading to implicit anys and the need for explicit types

33:25 - Getting types
* Most popular packages already have types — you install them like `npm i @types/whatever`
* If a package doesn't have types, you have to create them yourself, which can be annoying
  * [MakeTypes](https://jvilk.com/MakeTypes/)
  * Console log a JSON.stringify(obj), and pipe it in
* Node has types
* Vanilla JS has types, for the language and all of the DOM - HTMLInputElement
* React has types
* Typing Node modules that don't have types

### Overall benefits
40:39 - Type hinting
* With TS and your editor (VSCode) you'll get more information about your code as you type it — allowing you to know exactly what things expect
  * This seems like a small deal but in practice leads to being much more efficient

42:50 - Refactoring
* Rename a function, type, or variable and it will be updated everywhere in the project!
* Moving a function to a new file is actually part of TypeScript
* Drag + Drop file, update imports

48:10 - Compiling
* [TSC](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) vs [Babel](https://babeljs.io/) / [Esbuild](https://esbuild.github.io/)
* Only TSC type checks
* Compiling TS with babel will not allow you to break the build on type errors, you'll need to run TSC in coordination or in the CI/CD

## Links
* [Snipcart](https://snipcart.com/)
* [GraphQL](https://graphql.org/)
* [Snowpack](https://www.snowpack.dev/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott:
  * 1: [LumiPets](https://amzn.to/3sfw4Cp)
  * 2: [LumiPets Bear](https://amzn.to/2Lqkofk)
* Wes: [Phomemo Label Printer](https://amzn.to/2LGXT5T) 

## Shameless Plugs
* Scott: [ESM & Snowpack](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [All Courses](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets