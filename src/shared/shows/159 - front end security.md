---
number: 159
title: Hasty Treat - Front End Security
date: 1562590800835
url: https://traffic.libsyn.com/syntax/Syntax159.mp3
---

In this Hasty Treat, Scott and Wes talk about front end security and what to do in order to avoid hacking.

## Sentry - Sponsor

If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

2:53 - SSL

* Encrypted transfer of information
* Digitally binds a cryptographic key to an organization's details
* Web-cam, geolocation, etc.

6:15 - innerHTML 

* React's dangerouslySetInnerHTML
	* Name intentionally chosen to be frightening
	* Allows you to write HTML to the DOM
	* Data should be sanitized before used in prop
        * Removes unexpected data from string
        * Used to prevent cross site scripting attacks

10:25 - Don't trust the client

* The client can be manipulated to send any info to your server
* E-commerce example — don't take the price total from the front end to make the charge, DB call and calculate on the server
* Validate form inputs via HTML 5 field validation/check data types on the server
    * Don't allow your users to send an object when it should just be a string
    * Get this for free with GraphQL via types

13:41 - PCI Compliance

* Protect card holder data
    * SSL or Secure iFrame
* Encrypt transmission of card data
* Restrict access to card holder data
* Restrict physical access
    * Front of front-end

 16:44 - Tips

* Don't put a name on sensitive fields if you are using JS
* HTTP only cookies
* Local Storage tokens
* XSS

## Links
* [React](https://reactjs.org/)
* [GraphQL](https://graphql.org/)
* [Express](https://expressjs.com/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets