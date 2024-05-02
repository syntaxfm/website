---
number: 123
title: Hasty Treat - Authentication - LocalStorage vs Cookies vs Sessions vs Tokens
date: 1551708000946
url: https://traffic.libsyn.com/syntax/Syntax123.mp3
---

In this Hasty Treat, Scott and Wes talk about authentication — the difference between localStorage, cookies, session, tokens and more!

## LogRocket - Sponsor

[LogRocket](https://logrocket.com/syntax) lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session replayer and a performance monitor. Get 14 days free at [https://logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes

4:20 - How should we track users?

* Token based - generally stored in the client
* Session based - stored on the server 
* Token Based (JWT)

6:00 - Token-based auth

* Stateless - the server does not maintain a list of logged in users
* Scalable - you can use serverless functions easily
* Cross domain
* Data can be stored in JWT
* Easy to use on non-web sites like mobile apps
* Hard to expire tokens — you must maintain a list of blacklisted tokens

7:48 - Session-based auth 

* Stateful - generally you maintain a list of session IDs
* Passive - once signed in, no need to send token again
* Easy to destroy sessions

10:48 - How do we identify the user on each request? localStorage or Cookies?

* A common misconception is that localStorage is for tokens while cookies is for sessions
* With localStorage, we need to grab the token and send them along on each request
* With cookies, the data is sent along on each request

11:25 - Security Issues

* XSS for Tokens - make sure bad actors can't run code on your site
* Sanitize inputs
* XSRF - CSRF tokens are needed

## Links
* [Cookies vs Tokens: The Definitive Guide](https://dzone.com/articles/cookies-vs-tokens-the-definitive-guide)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
