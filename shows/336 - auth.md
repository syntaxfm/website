---
number: 336
title: How To Build Your Own Auth
date: 1615986000954
url: https://traffic.libsyn.com/syntax/Syntax336.mp3
---

In this episode of Syntax, Scott and Wes talk about building your own authentication — diving deep into JWT, sessions, tokens, cookies, local storage, CSRF, and how it all works!

## Prismic - Sponsor
Prismic is a Headless CMS that makes it easy to build website pages as a set of components. Break pages into sections of components using React, Vue, or whatever you like. Make corresponding Slices in Prismic. Start building pages dynamically in minutes. Get started at [prismic.io/syntax](https://prismic.io/syntax).

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Hasura - Sponsor
With Hasura, you can get a fully managed, production-ready GraphQL API as a service to help you build modern apps faster. You can get started for free in 30 seconds, or if you want to try out the Standard tier for zero cost, use the code “TryHasura” at this link: [hasura.info](https://hasura.info/freetrial). We’ve also got an amazing selection of GraphQL tutorials at [hasura.io/learn](https://hasura.io/learn).

## Show Notes
01:51 - Overview
* [Level Up](https://www.leveluptutorials.com/) uses a [JWT](https://jwt.io/) & secure cookie-based authentication and tracks sessions via a db table.
* [Accounts.js](https://www.accountsjs.com/)

05:13 - [JWT](https://jwt.io/)
* Base 64 encoded (not encrypted) token that contains data. We have both `accessToken`s and `refreshToken`s.
* JWT has three parts:
  * Header
    * What kind of algo was used
  * Payload
    * Data about the user
    * Email
    * Username
    * UserID
    * refreshToken, authToken, sessionId
  * Signature
    * This ensures that no one monkeyed with the above parts. If you change your email in the payload, the signature is not invalid, because in order to generate the signature, it uses the header and payload as part of it.
* accessToken
  * A short lived JWT that containsthe `sessionToken`, `userId` and expires after 90min.
* refreshToken
  * A long lived JWT that contains just the `sessionToken` and doesn't expire.
* JWT can be decoded and read, but you have to encode them with your secret. 
* JWT can be stored anywhere, there are two main places:

20:26 - Cookies
* We use httpOnly, secure cookies to store the accessToken and the refreshToken. The accessToken is a session cookie and is removed whenever the browser is closed. The refreshToken is valid for 100 days but is also re-created and revalidated for 100 more days each time the accessToken is generated.
* Because these are httpOnly cookies, they cannot be accessed by JavaScript in the client and can only be set and removed on the server.
* Note: Safari has stricter rules than others for same domain cookies (e.g. `localhost` won't work).

34:26 - Sessions
* Sessions are when a user logs in on a device. If you open a phone and log in and a computer and log in, those will create two different sessions. A session contains information about the user's connection (like their IP) but it also contains the userId which allows us to create new accessTokens from a valid session.
* Sessions can be valid or invalid. This allows us to log anyone out by setting their session to valid: false.
* Sessions also have `sessionToken` which are generated on authentication or create account.

38:10 - [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
* Cross-origin-resource-sharing
* Can be super tricky to get working cross-domain
* You usually have to actually visit the website for the cookie to be set, even with lax cors

46:06 - [CSRF](https://developer.mozilla.org/en-US/docs/Glossary/CSRF)

48:47 - Authentication process
* [bcrypt.js](https://www.npmjs.com/package/bcryptjs)

52:13 - Helper Packages
* [NextAuth.js](https://next-auth.js.org/) is super easy
* [Passport.js](http://www.passportjs.org/)
* [auth0](https://auth0.com/)

## Links
* [Caddy](https://caddyserver.com/)
* [Fastify](https://www.fastify.io/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [reMarkable 2](https://remarkable.com/store/remarkable-2)
* Wes: [Opration Odessa](https://www.netflix.com/title/80202236)

## Shameless Plugs
* Scott: [Node Fundamentals Authentication](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [Advanced React](https://advancedreact.com/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets