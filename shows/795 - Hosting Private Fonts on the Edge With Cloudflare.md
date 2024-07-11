---
number: 795
title: Hosting Private Fonts on the Edge With Cloudflare
date: 1721041200000
url: https://traffic.libsyn.com/syntax/Syntax_-_795.mp3
youtube_url: https://www.youtube.com/watch?v=P0jwGsCWmPs
---

Scott and Wes dish out the intricacies of hosting private fonts using Cloudflare Pages. They explore the challenges of font security, the benefits of a font server, and the nuances of caching and whitelisting to keep your fonts secure and efficient.

### Show Notes

* **[00:00](#t=00:00)** Welcome to Syntax!
* **[01:53](#t=01:53)** [Behind the Code](https://sentry.io/resources/behind-the-code-a-discussion-with-backend-experts/): Brought to you by [Sentry.io](https://sentry.io/syntax).
* **[03:12](#t=03:12)** The problem with hosting fonts.
    * [Scott's Fonts](https://github.com/stolinski/scotts-fonts-worker-exploration).
* **[05:42](#t=05:42)** The solution, a font server with [Cloudflare Pages](https://pages.cloudflare.com/).
* **[09:37](#t=09:37)** Utilizing a Key Value Store.
* **[10:53](#t=10:53)** Storing a whitelist.
* **[13:42](#t=13:42)** Why not just use a bucket?
    * [Check out the code](https://github.com/stolinski/scotts-fonts/blob/main/src/routes/fonts/%5Bpath%5D/%2Bserver.ts).
* **[15:24](#t=15:24)** Should whitelisting be done in JavaScript or cores?
* **[17:23](#t=17:23)** How do you cache to multiple origins?
* **[18:15](#t=18:15)** Multiple URLs in an allow origin.
* **[19:17](#t=19:17)** Font security and foundry challenges.
* **[21:43](#t=21:43)** Moving Domains on Cloudflare.

Check out the font Syntax uses! [MD-IO](https://mass-driver.com/typefaces/md-io/).

### Hit us up on Socials!

Syntax: [X](https://twitter.com/syntaxfm) [Instagram](https://www.instagram.com/syntax_fm/) [Tiktok](https://www.tiktok.com/@syntaxfm) [LinkedIn](https://www.linkedin.com/company/96077407/admin/feed/posts/) [Threads](https://www.threads.net/@syntax_fm)

Wes: [X](https://twitter.com/wesbos) [Instagram](https://www.instagram.com/wesbos/) [Tiktok](https://www.tiktok.com/@wesbos) [LinkedIn](https://www.linkedin.com/in/wesbos/) [Threads](https://www.threads.net/@wesbos)

Scott: [X](https://twitter.com/stolinski) [Instagram](https://www.instagram.com/stolinski/) [Tiktok](https://www.tiktok.com/@stolinski) [LinkedIn](https://www.linkedin.com/in/stolinski/) [Threads](https://www.threads.net/@stolinski)

Randy: [X](https://twitter.com/randyrektor) [Instagram](https://www.instagram.com/randyrektor/) [YouTube](https://www.youtube.com/@randyrektor) [Threads](https://www.threads.net/@randyrektor)
