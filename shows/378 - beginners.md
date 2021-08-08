---
number: 378
title: How to Build a Website — The Show For Beginners
date: 1628686800325
url: https://traffic.libsyn.com/syntax/Syntax378.mp3
---

In this episode of Syntax, Scott and Wes talk about the basics of building a website — how to get started for beginners!

## Freshbooks - Sponsor
Get a 30 day free trial of Freshbooks at [freshbooks.com/syntax](https://freshbooks.com/syntax) and put SYNTAX in the "How did you hear about us?" section.

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Mux - Sponsor
Mux Video is an API-first platform that makes it easy for any developer to build beautiful video. Powered by data and designed by video experts, your video will work perfectly on every device, every time. Mux Video handles storage, encoding, and delivery so you can focus on building your product. Live streaming is just as easy and Mux will scale with you as you grow, whether you're serving a few dozen streams or a few million. Visit [mux.com/syntax](https://mux.com/syntax).

## Show Notes
04:20 - HTML
* HTML is the language you write to get text and elements to show up on the screen
* Elements can describe the content they contain
  * p
  * img
* Or be structural and describe the areas of the website
  * div
  * h
  * header, footer
* Listen to our ep on HTML elements to learn more about them: [Syntax 354: The Surprisingly Exciting World of HTML Elements](https://syntax.fm/show/354/the-surprisingly-exciting-world-of-html-elements)
* HTML elements have default styling applied to them before you write any CSS
  * This comes from the browser and can be manipulated
  * However, by default all elements are either block or inline-display

08:11 - CSS
* If HTML is the bones, CSS is the clothes and skin
* CSS dictates how a website looks
  * Without CSS, you have text on a blank page and images
* CSS stands for Cascading Style Sheets ("cascading" being the key word)
* Adding CSS to a page
  * Link tag
  * Style tag
  * Inline styles
* Selectors
  * You can select an element on the page via element, class, id, attribute
  * Syntax is selector, brackets, property, value
* Property
  * A property is what you are changing (e.g. background-color)
* Value determines how the thing looks
  * `background: red;`
* Specificity
  * Specificity is a big part of the cascade. When you apply one style to something, you need to learn how to target things appropriately. This is a huge part of being good at CSS.
  * People develop systems like BEM to organize this
  * General rules - Use elements for base styling and classes for specific styling. Don't use IDs for styling.
  * `!important` exists to override everything, but as a general rule, NEVER use it. Seriously.
* Some interaction
  * Most interaction is done in JavaScript, but CSS has some basics
    * hover, active, focus
* Pseudo selectors
* You'll often see people reaching for libraries to make CSS easier and more consistent
  * Common examples are Bootstrap, Foundation, and TailwindCSS
  * For the most part you'll want to avoid these until you have a good understanding of the cascade, how CSS works, and how to write good CSS.
* In addition to properties, you can now write your own custom properties for CSS.
  * While this could be seen as an advanced technique, I believe the new normal is CSS variables first.
  * CSS variables are indicated by `—variableName: value;` where variable name takes the place of a property.
  * You can then use the variable via var(—variableName) in place of a property. This allows for easy duplication of same values across your style sheet.

37:08 - JavaScript
* JavaScript is used to add *interaction* to a website
* It makes your website dynamic

**JavaScript the Language**
* We have a base programming language that has nothing to do with HTML
* It has things like:
  * Variables - ways to store things
  * Numbers + Math
  * Data Containers - Objects and Arrays
  * Functions - Code grouped together to achieve a certain purpose
* It also has a "Standard Lib" which means JavaScript comes with built-in support for doing common things:
  * Formatting time + money
  * Alerting the user
  * Logging a value to developer tools
  * Capitalizing things
  * Sorting lists of things
  * Round or randomize numbers
  * Fetch data
  * Talk to a sever
* Promises
  * Logic and flow control

**JavaScript the DOM**
* When the HTML is loaded, it's parsed into something called the DOM (Document Object Model)
* Events
  * JavaScript is mostly event-driven - when something happens, do something else
  * When you click something and want something else to happen
  * There are lots of events
    * mouse, touch, pointer
    * Ready
    * Forms
      * Submit, change, keyboard, etc.
* Can be used to fetch data
  * `fetch()` - you'll often hear it called Ajax, or XMLHttpRequest
* Can be used to make more HTML
  * Whole set of APIs for creating elements
* The DOM can be traversed

## Links
* [https://css-tricks.com/](https://css-tricks.com/)
* [https://getbootstrap.com/](https://getbootstrap.com/)
* [https://get.foundation/](https://get.foundation/)
* [https://tailwindcss.com/](https://tailwindcss.com/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Tony Hawk's Pro Skater 1 + 2](https://www.nintendo.com/games/detail/tony-hawks-pro-skater-1-and-2-switch/)
* Wes: [Mini Split Air Conditioner](https://www.amazon.com/s?k=Mini+Split+AC)

## Shameless Plugs
* Scott:
  1: [Level Up Tuts Pro](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
  2: [Become a Level Up Tutorials Author](https://forms.gle/PDEpDAGZpNHBDVou5)
* Wes:
  1: [All Courses](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!
  2: [Javascript Notes & Reference](https://wesbos.com/javascript)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets