---
number: 88
title: Pre-launch Checklist
date: 1540990800680
url: https://traffic.libsyn.com/syntax/Syntax088.mp3
---

In this episode Wes and Scott discuss their pre-launch checklists. They talk about performance, accessibility, compatibility, SEO, analytics, and more - all the things you should check before launching something to the world.

## Sentry - Sponsor

If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## .tech Domains - Sponsor

Finding a great domain name is tough with so many names already taken. If you're looking for a domain name for your startup, side project, or anything at all, check out [.tech Domains](https://get.tech). Syntax listeners can get 90% off both one-year, five-year and ten-year registration by visiting [go.tech/syntax](https://go.tech/syntax) and using the coupon code "syntax".

## Show Notes

1:45 - Overall

* Let robots do the work for you - use auditing tools
  * [Lighthouse](https://github.com/GoogleChrome/lighthouse)
  * SEO Checkers
  * Accessibility checkers like [axe](https://www.deque.com/axe/)

2:58 - Performance

* Compress those images
  * Build process
  * [Cloudinary](https://cloudinary.com/)
  * [ImageOptim](https://imageoptim.com)
  * [imgIX](https://www.imgix.com/)
* Minify
* Code Splitting
  * Smaller bundles where it makes sense
  * A future where it’s done for us
* Run page speed tests like [Google PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/)
* Don’t service worker on launch
* [Syntax Ep 50 - Progressive Web Apps](https://syntax.fm/show/050/progressive-web-apps)

11:43 - Compatibility

* Test on actual browsers that need to be supported
* Ask people to check on their devices
* Use a service like [Browserstack](https://www.browserstack.com/)
* Browser resolution and ratios
* Cache busters

16:00 - Sales / Credit Cards

* Use package.lock
* Have multiple people test your checkout
* Make sure your company name is listed on customer's credit card bills
* Have a phone number listed for disputes

24:55 - Tips from the Trenches

* Secure API endpoints
* Scale up server just in case
* Early access
* Soft launch
* Make sure URLs are correct - no "localhost:3000", etc.

31:25 - Content

* Check spelling and grammar
* A working 404 page
* Check for leftover placeholder text → launching with lorem ipsum is not good

34:39 - Accessibility

* Alt text
* Run color contrast checker
* Run Lighthouse
* Correct tab order
  * Use the site with keyboard only and make sure it’s a good experience

37:35 - SEO

* Sitemap created and uploaded to Google Webmaster Tools
* SEO checkers
* Meta tags
* Correct heading hierarchy

41:55 - Analytics

* Google analytics
* Facebook tracking pixel
* [Drip](https://www.drip.com/)


43:23 - Server config & access

* .htaccess
  * redirects where needed
* robots.txt
  * prevent indexing of some pages
* Enable GZIP
* Caching
* [Cloudflare](https://www.cloudflare.com/) or other CDN

46:12 - Company Processes

* Make sure tests are passing
* Git issues are closed
* Merge pull requests
* Write documentation on processes (readme, etc.)
* Deploy to staging environment and test production build
* No unwanted logs or errors left in production build
* DNS Propagation

## ××× SIIIIICK ××× PIIIICKS ×××

* Scott: [Swindled Podcast](http://swindledpodcast.com/)
* Wes: [FIFO Bottles](https://amzn.to/2R6V2jX)

## Shameless Plugs

* [Scott's Level Up Pro](https://LevelUpTutorials.com/pro)
* [Wes' Advanced React Course](https://advancedreact.com/) - use the code SYNTAX for $10 off

## Tweet us your tasty treats!

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
