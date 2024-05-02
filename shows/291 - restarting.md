---
number: 291
title: Hasty Treat - Updating / Restarting Long-Running Web Apps
date: 1602680400281
url: https://traffic.libsyn.com/syntax/Syntax291.mp3
---

In this Hasty Treat, Scott and Wes talk about updating web apps that have running for a long time — the problems to look out for and how to avoid them.

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes

01:54 - The problem
* This only affects the client-side

05:28 - What are some solutions:
* Do nothing and hope the  user refreshes.
* Have a list of assets, or commit hashes. Poll the server periodically, and when there is a new version available:
    * Prompt the user to refresh
    * Just refresh the user (store current state in localstorage and restore)
* Do a custom <Link> component, that checks the last time the user has refreshed (or if new version if available). When they click the link, render a regular <a> instead of a pushstate link.
* Use a service worker. They will emit an event when a new version is available. Use the above methods to refresh the user.
* Hot code push.
    * Vuepress has "hot reloading" baked in.

## Links
* [https://twitter.com/wesbos/status/1306969658751361024](https://twitter.com/wesbos/status/1306969658751361024)
* [Notion](https://notion.so)
* [Vuepress](https://vuepress.vuejs.org/)
* [Meteor](https://www.meteor.com/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets