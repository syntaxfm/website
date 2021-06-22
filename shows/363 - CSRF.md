---
number: 363
title: Hasty Treat - CSRF Explained
date: 1624280400183
url: https://traffic.libsyn.com/syntax/Syntax363.mp3
---

In this Hasty Treat, Scott and Wes talk about CSRF (Cross Site Request Forgery)!

## Prismic - Sponsor
Prismic is a Headless CMS that makes it easy to build website pages as a set of components. Break pages into sections of components using React, Vue, or whatever you like. Make corresponding Slices in Prismic. Start building pages dynamically in minutes. Get started at [prismic.io/syntax](https://prismic.io/syntax).

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Show Notes
05:40 - What is it?
* [https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#samesite-cookie-attribute](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#samesite-cookie-attribute)
* Someone can submit a form FROM or TO your domain, automatically. 

07:50 - Solutions
* SameSite Cookie
* [https://medium.com/swlh/secure-httponly-samesite-http-cookies-attributes-and-set-cookie-explained-fc3c753dfeb6](https://medium.com/swlh/secure-httponly-samesite-http-cookies-attributes-and-set-cookie-explained-fc3c753dfeb6)
  * Lax — Default value in modern browsers. Cookies are allowed to be sent with top-level navigations and will be sent along with GET requests initiated by a third party website. The cookie is withheld on cross-site subrequests, such as calls to load images or frames, but is sent when a user navigates to the URL from an external site, such as by following a link.
  * Strict — As the name suggests, this is the option in which the Same-Site rule is applied strictly. Cookies will only be sent in a first-party context and not be sent along with requests initiated by third party websites. The browser sends the cookie only for same-site requests (that is, requests originating from the same site that set the cookie). If the request originated from a different URL than the current one, no cookies with the SameSite=Strict attribute are sent.
  * None — Cookies will be sent in all contexts, i.e sending cross-origin is allowed. The browser sends the cookie with both cross-site and same-site requests.
* CSRF Token
* Check Origin / Referrer Headers
* Captcha
* Ask for Password
* Token

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets