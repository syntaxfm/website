---
number: 346
title: Selling and Shipping T-Shirts with TypeScript
date: 1619010000543
url: https://traffic.libsyn.com/syntax/Syntax346.mp3
---

In this episode of Syntax, Scott and Wes talk about selling and shipping t-shirts, and how to do it all in TypeScript!

## Prismic - Sponsor
Prismic is a Headless CMS that makes it easy to build website pages as a set of components. Break pages into sections of components using React, Vue, or whatever you like. Make corresponding Slices in Prismic. Start building pages dynamically in minutes. Get started at [prismic.io/syntax](https://prismic.io/syntax).

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Deque - Sponsor
Deque’s axe DevTools makes accessibility testing easy and doesn’t require special expertise. Find and fix issues while you code. Get started with a free trial of axe DevTools Pro at [deque.com/syntax](https://www.deque.com/syntax). No credit card needed.

## Show Notes
01:58 - T-Shirts 101
* T-Shirts are cool
* I sold 100 right away to get the kinks out
* Then I did pre-order
* The stack
  * [TypeScript](https://www.typescriptlang.org/)
  * [React](https://reactjs.org/)
  * [Next.js](https://nextjs.org/)

09:08 - Selling: Front-end
* [Snipcart](https://snipcart.com/)
* It's a button
* When Someone buys, they scrape the site for the HTML
  * If you only have a client-side rendered button, you use the JSON API instead
* Integrated into [Gatsby](https://www.gatsbyjs.com/) pretty easily
* Wrote one custom hook to count inventory and disable when sold out
* I thought Snipcart would be enough, but I soon realized it wasn't. I needed something to fulfill the shipment.

10:10 - Selling: Shipping Quotes
* Snipcart has integration for USPS, etc.
* You can also do custom shippers
* It's a webhook
* They also take care of customs declaration

13:30 - Selling: Backend
* Next.js Dashboard
  * Integrate with [ChitChats](https://chitchats.com/en), [Stallion Express](https://stallionexpress.ca/), and SnipCart.
* The tech
* Shipping Labels
  * Packing slip

18:05 - Fulfilling
* Printing labels
  * Designed with CSS + React
  * Print CSS is wild
  * Fan Fold labels were way better
  * I switched to Stallion Express
  * Cheaper
* Printing packing slips
* Batch scanning
* Scanning → Mark as shipped
  * Started with webcam
  * Bought scanner for cheap
  * QR code was better because my tokens were long
  * Data matrix is often better
* Sending notifications
  * Hit the endpoint via Snipcart

28:48 - The physical part
* T-Shirts printed from local supplier
  * U-Haul to get them here
* Bags printed in China (about 40 cents each)
* I wrote a bunch of code to organize by size
  * This cut down on moving around (14 hours if you save 30 seconds per shirt)
* Some got stickers
* Multiples were the hardest
  * 24 different types of shirts
    * some wanted 4xl
    * some wanted tall

36:30 - Common questions
* Why did you do this yourself?
  * Fun project
  * I learned a ton
  * This is how you don't burn out
* Why not print-on-demand? (DTG)
  * Tonal
  * Embroidery
  * Quality
  * Money
    * Pay people in my community
* Control
  * Bags, stickers, etc..
  * [stickermule](https://www.stickermule.com/)
* Why not $companyThatHandlesIt
  * I want to do stickers
  * I want to do decks
* Why not [Shopify](https://www.shopify.com/)
  * Large orders still need major fulfillment strategies
  * Code has to be written or money spent

44:16 - Other lessons learned
* Queues would be good here
  * Sometimes you had to wait 3+ seconds for the confirmation of shipping
* No one reads, it was pre-order
* Don't buy shipping right away — people email about incorrect addresses
* Over-order by a few each (out of 1550 orders, five got partial refunds and three got full refunds)
* Pre-order is great because you can offer many sizes
* Async JS to do things at most 50 at a time

## Links
* [Wyze Plug](https://wyze.com/wyze-plug.html)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Pixeleyes AutoMounter](https://www.pixeleyes.co.nz/automounter/)
* Wes: [Baratza Encore Conical Burr Coffee Grinder](https://www.amazon.com/Baratza-Encore-Conical-Coffee-Grinder/dp/B007F183LK/)

## Shameless Plugs
* Scott: [Level 2 Node Authentication](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [All Courses](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets