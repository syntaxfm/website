---
number: 389
title: Hasty Treat - Webhooks
date: 1632142800657
url: https://traffic.libsyn.com/syntax/Syntax389.mp3
---

In this Hasty Treat, Scott and Wes talk about webhooks — one of those concepts that seems a lot scarier than it actually is. 

## Linode - Sponsor
Whether you’re working on a personal project or managing enterprise infrastructure, you deserve simple, affordable, and accessible cloud computing solutions that allow you to take your project to the next level. Simplify your cloud infrastructure with Linode’s Linux virtual machines and develop, deploy, and scale your modern applications faster and easier. Get started on Linode today with a $100 in free credit for listeners of Syntax. You can find all the details at [linode.com/syntax](https://linode.com/syntax). Linode has 11 global data centers and provides 24/7/365 human support with no tiers or hand-offs regardless of your plan size. In addition to shared and dedicated compute instances, you can use your $100 in credit on S3-compatible object storage, Managed Kubernetes, and more. Visit [linode.com/syntax](https://linode.com/syntax) and click on the “Create Free Account” button to get started.

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes
03:42 - What are webhooks?
* User-defined HTTP callbacks
* When something happens, ping this URL with this data
* Examples:
  * When something sells, ping this URL
  * When someone reverses a charge, lock their account
  * Trigger a build of the website when the content changes
  * Then someone buys a shirt, generate a shipping label and save it to the DB

07:57 - Sending End
* Can be a great way to hook two services together

09:13 - Receiving End
* Often you will be the one that accepts the webhook ping
* In this case, you set up an endpoint

11:00 - Payloads
* Almost all will send a JSON body that you parse out
* The method send is variable

11:51 - Auth
* On the receiving end of a webhook, you often get a token which you can then ping the service with. It will tell you if that request was legit or not. 
* On the sending end, you can often set up headers with auth - same with the method
* Can be a replacement for a serverless function

13:18 - Testing webhooks
* Can be a pain in the ass
* [ngrok](https://ngrok.com/) - expose locally
* [localtunnel](https://theboroer.github.io/localtunnel-www/)
* [Insomnia](https://insomnia.rest/)
* [Postman](https://www.postman.com/)
* [Stripe](https://stripe.com/) has a great VS code extension
* [Snipcart](https://snipcart.com/) has an awesome dashboard
  * Will also tell you when one failed
* [webhook.site](http://webhook.site) 
* [https://expose.dev/](https://expose.dev/)
* [IFTTT](https://ifttt.com/)
* [Zapier](https://zapier.com/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets