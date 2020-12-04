---
number: 308
title: Gatsby vs Next.js in 2021
date: 1607522400135
url: https://traffic.libsyn.com/syntax/Syntax308.mp3
---

In this episode of Syntax, Scott and Wes talk about Gatsby vs Next. A lot has changed in the last year — what are the differences, and do the recommendations from Syntax 120 still hold true?

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

03:34 - Server-rendered
* Both do server rendered
* Gatsby is gone at build time
* Next is done at build and on deploy

05:26 - Static generation
* getStaticProps()
* getServerSideProps()

08:25 - Re-rendering pages
* Gatsby can be re-rendered and re-deployed - any CMS lets you do this on only the pages that changed.
* Gatsby-cloud
* Next.js has the revalidate flag that will re-render when stale

18:54 - Data management
* Gatsby has a built in GraphQL API feature with
* Next.js has nothing - it's not their problem. Use Apollo, or SWR, React Query, or redux, or whatever you want.

23:16 - Client-side data
* Neither do anything, next.

26:33 - Dynamic Pages
* List of 100 shoes, each one gets a page
* List of four types of shoes: basketball, runners, casual, bowling, etc.
* List of 10 colors: each color gets its own page.
* List of 12 sizes, each size gets its own page.
* Now it gets complicated when you do this:
    * Show me basketball shoes, in red, in size 5
    * 600 pages minimum
    * What about size 6+7?
    * Then you get into having to fetch data on the client side - but all your data is in GraphQL?!
    * The queries are different!
* Gatsby will get "Hosted GraphQL": [https://twitter.com/kylemathews/status/1252803849775009794](https://twitter.com/kylemathews/status/1252803849775009794)

30:41 - Routing
* Neither do nested routing still
* Both do folder based wrapper

34:50 - Hosting
* Anywhere

35:54 - Images
* Compression/resize
* Lazy loading
* SVG
* Blur up
* Next 10 released first revision of Next.js image
    * It's not as good as Gatbsy-image
    * Must specify width and height, whereas gatsby has fixed and fluid
    * Compression
    * No blur up
    * Yes lazy loading
    * both don't support gifs
    * Gatbsy requires annoying GraphQL query OR another plugin like MDX to do it
        * Not for long! [https://twitter.com/ascorbic/status/1320770231657238529](https://twitter.com/ascorbic/status/1320770231657238529)
    * Next.js is just `<image src=""`
    * Next does remote images
    * Neither have quality or format auto like Cloudinary does
    * Gatsby images have to be compressed at build time
    * Next.js can do it on the fly
        * assuming your server has the right tooling installed
* The GOLD STANDARD - [https://gridsome.org/docs/images/](https://gridsome.org/docs/images/)
    * Lib authors need to give this a look
* [https://twitter.com/mxstbr/status/1323279745275101184](https://twitter.com/mxstbr/status/1323279745275101184)
* [https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-plugin-image](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-plugin-image)

46:20 - Server or Serverless
* Gatsby - none. You can do it with Netlify, Begin, AWS, Gatsby doesn't care.
* Next.js - can do server with API routes. Can do serverless if you host on Vercel.

49:44 - SEO
* Tags
    * Gatsby - Helmet
    * Next - Head
* Sitemap
    * Plugin for both

49:55 - Plugin Ecosystem
* Gatsby has lots of plugins that you install
* Next.js has some too. Seems Gatsby is easier in this regard because plugins can manage and normalize data into the GRaphQL Layer.

53:10 - Auth
* Neither do auth
* The first to do baked-in auth solution could get big gains.
* See Scott's Svelte Meteor accounts set up. It good. [https://github.com/leveluptuts/svelte-accounts-ui](https://github.com/leveluptuts/svelte-accounts-ui)

55:00 - E-commerce
* Gatsby - options are mostly limited to Snipcart and Shopify like iframe drop in solutions where the majority of operations take place on another site and service.
* Next.js - hey released a starter boilerplate that leans on an existing headless cart
* [https://rainierwatch.com/](https://rainierwatch.com/)

## Links
* [Syntax 120: Gatsby vs Next](https://syntax.fm/show/120/gatsby-vs-next)
* [Gatsby](https://www.gatsbyjs.org/)
* [Next.js](https://nextjs.org/)
* [Svelte](https://svelte.dev/)
* [Meteor](https://www.meteor.com/)
* [Vercel](https://vercel.com/)
* [GraphQL](https://graphql.org/)
* [https://www.swyx.io/react-sfcs-here/](https://www.swyx.io/react-sfcs-here/)
* [React Query](https://react-query.tanstack.com/)
* [SWR](https://swr.vercel.app/)
* [React Router](https://reactrouter.com/)
* [gatsby-image](https://www.gatsbyjs.com/plugins/gatsby-image/)
* [Cloudinary](https://cloudinary.com/)
* [imgIX](https://www.imgix.com/)
* [Begin](https://begin.com/)
* [Netlify](https://www.netlify.com/)
* [https://reactioncommerce.com/](https://reactioncommerce.com/)
* [Shopify](https://www.shopify.com/)
* [SnipCart](https://snipcart.com/)
* [WooCommerce](https://woocommerce.com/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Cobra Drain Zip It](https://amzn.to/2TOqDdw)
* Wes: Deli Containers:
    * [Mixed Boys](https://amzn.to/3kSQmxh) 
    * [Small Boys](https://amzn.to/3kUC53h)
    * [Medium Boys](https://amzn.to/3evBh2F) 
    * [Large Boys](https://amzn.to/2JypwNv)

## Shameless Plugs
* Scott: [Animating Svelte](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [Advanced React Course](https://advancedreact.com/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets