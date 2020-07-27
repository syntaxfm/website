---
number: 255
title: Hasty Treat - Slow Connections Part 2
date: 1591621200494
url: https://traffic.libsyn.com/syntax/Syntax255.mp3
---

In this Hasty Treat, Scott and Wes are back with part 2 on how to develop for slow internet connections. 

## Kyle Prinsloo Freelancing - Sponsor
Kyle Prinsloo teaches you everything you need to know about freelancing, including how to quit your job, earn a side-income and start taking control of your life. Check it out at [studywebdevelopment.com/freelancing](https://studywebdevelopment.com/freelancing). Use the coupon "SYNTAX" and get 25%.

## Show Notes

03:27 - Images

* Resize client-side when uploading
* Lazy load or progressive JPG
* Width + height so the content doesn't shift with placeholders
* Compress your images - lossless and lossy
* Use SVG where possible

08:33 - Scripts + CSS assets

* [Hasty Treat - 5 Things That Make Your Site Slow](https://syntax.fm/show/239/hasty-treat-5-things-that-make-your-site-slow)
* [Hasty Treat - 5 More Things That Make Your Site Slow](https://syntax.fm/show/241/hasty-treat-5-more-things-that-make-your-site-slow)

08:51 - Video

* Variable-rate video is key

09:13 - Connections that go in-n-out a lot

* Save form state on page refresh
* Show UI when user goes offline
  * `window.addEventListener('offline', updateOnlineStatus);`
  * `window.addEventListener('online', updateOnlineStatus);`
* Retrying in _____

10:27 - Service workers! 

* Serves up local cache initially

12:05 - Fonts

* Font-display CSS [https://css-tricks.com/font-display-masses/](https://css-tricks.com/font-display-masses/)
* Sometimes possible: tree shake your fonts - load only the characters you need
* `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;`

14:04 - CSS tricks

* Text over background image — make sure you also set a color so the text will show while the image is loading

14:37 - Testing slow connections

* Dev tools
* Mimic a speed, or 3G

## Links
* [ImageOptim](https://imageoptim.com/)
* [Slack](https://slack.com/)
* [Discord](https://discord.com/)
* [Cloudflare](https://www.cloudflare.com/)
* [Workbox by Google](https://developers.google.com/web/tools/workbox)
* [Chrome Dev Tools](https://developers.google.com/web/tools/chrome-devtools)
* [Firefox Dev Tools](https://developer.mozilla.org/en-US/docs/Tools)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
