---
number: 228
title: More on Severless - Databases × Files × Secrets × Auth × More!
date: 1583330400634
url: https://traffic.libsyn.com/syntax/Syntax228.mp3
---

In this episode of Syntax, Scott and Wes do a part 2 about Serverless — databases, files, secrets, auth, and more!

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## Freshbooks - Sponsor
Get a 30 day free trial of Freshbooks at [freshbooks.com/syntax](https://freshbooks.com/syntax) and put SYNTAX in the "How did you hear about us?" section.

## Show Notes

2:47 - Wes tried Cloudflare Workers

* Also this is so cool:

> Hey Wes, just listened to the latest Syntax episode on the serverless setup. Not sure if it's an episode idea or not, but if you wanna do a bit of a dive on Cloudflare's service workers, I'm currently leading an "invisible infrastructure migration" right now from a legacy WordPress setup to a new Storyblok/Netlify setup. We're using Cloudflare's service workers to basically "stitch" the headers/menus/footers from the old WordPress site into our new Netlify pages, but serving the page back as if it was part of the normal domain. This means we can migrate from the old to the new slowly without massively disrupting SEO, doing a lengthy/costly rebuild, etc.

* A word on Digital Ocean
* Kubernetes + FAAS allows you to scale up/down

13:54 - Secret management

* Some have a great UI
* Some have a CLI
* Some only have production
* Some have dev/staging/prod

16:24 - Vendor lock-in

* Two kinds of vendor lock-in
  * Lock into a low-level provider (like AWS, or MongoDB)
  * Lock into a framework
* Questions to ask:
  * Can I go, take my app as-is, and host it on another provider?
  * Can I refactor the config and run my code as-is?
  * Do I need to refactor my code for it to run on other platforms?
* Next.js will only run on Now
* There is a community package
* Begin all runs on Arc.codes
* Firebase is locked in?

25:12 - Sharing dependencies

* Each function will have its own package.json, which can be a pain
* Publish utils a private module
* AWS Layers
* Import/export
* Bundle and tree shake

30:26 - Local development

* Now dev
* NPX sandbox
* Wrangler for Cloudflare workers

36:40 - Existing applications

* Difficult to move with many routes, but easy to move a Graphql API that has one single route
* Maybe do piece by piece instead of all at once
* Begin has http express method

45:21 - Data

* Any DB you want
* Dynamo DB integrated into many
* Firebase
* KV Storage for Cloudflare workers
* [Fauna](https://fauna.com/)

48:14 - File storage

* Generally files go in the associated file place like Amazon S3, Backblaze B2, Cloudinary
* Many also have this integrated as well

52:18 - Auth

* Serverless is ephemeral and stateless
* JWT likely as sessions will work, but doesn't really make sense

## Links
* [Cloudflare Workers](https://workers.cloudflare.com/)
* [Akamai](https://www.akamai.com/)
* [MongoDB Stitch](https://www.mongodb.com/cloud/stitch)
* [Hitler uses Kubernetes](http://youtube.com/watch?v=9wvEwPLcLcA)
* [Digital Ocean](https://www.digitalocean.com/)
* [Kubernetes](https://kubernetes.io/)
* [Firebase](https://firebase.google.com/)
* [Google Cloud](https://cloud.google.com/)
* [Architect](https://arc.codes/)
* [Next.js](https://nextjs.org/)
* [Now.sh](https://zeit.co/home)
* [Begin](https://begin.com/)
* [Netlify](https://www.netlify.com/)
* [Now](https://github.com/zeit/now)
* [Wrangler](https://github.com/cloudflare/wrangler)
* [Apollo Federation](https://www.apollographql.com/docs/apollo-server/federation/introduction/)
* [Monaco](https://microsoft.github.io/monaco-editor/)
* [Postman](https://www.postman.com/)
* [Codesandbox](https://codesandbox.io/)
* [DynamoDB](https://aws.amazon.com/dynamodb/)
* [Amazon S3](https://aws.amazon.com/s3/)
* [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
* [Cloudinary](https://cloudinary.com/)
* [Fauna](https://fauna.com/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [The Power of Bad by John Tierney](https://www.amazon.com/Power-Bad-Negativity-Effect-Rules-ebook/dp/B07Q3NHPGZ)
* Wes: [Socket Organizer](https://amzn.to/2VhBbUt)

## Shameless Plugs
* Scott: [Animating React with Framer Motion](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [All Courses](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
