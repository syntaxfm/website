---
number: 753
title: Cache Ruins Everything Around Me
date: 1712574000293
url: https://traffic.libsyn.com/syntax/Syntax_-_753.mp3
youtube_url: https://www.youtube.com/watch?v=j8oD976nhZk
---

Scott and Wes dive into the cache problem, tackling user-specific data and caching security. From marketing A/B testing to content negotiation, they explore various challenges and solutions, including different URL/query parameters, edge logic, and client-side caching.

### Show Notes

* **[00:00](#t=00:00)** Welcome to Syntax!
* **[01:22](#t=01:22)** Syntax is on [YouTube](www.youtube.com/@syntaxfm).
* **[02:16](#t=02:16)** Let's talk about the cache problem.
* **[03:33](#t=03:33)** User-specific data and caching security.
* **[06:27](#t=06:27)** Why might this pop up?
    * **[06:29](#t=06:29)** Marketing A/B testing - cookie based.
    * **[06:55](#t=06:55)** User-selected features - such as themes.
    * **[06:58](#t=06:58)** Language or geo-based items - accept language.
    * **[07:11](#t=07:11)** Images - WebP for some browsers, jpg for others.
    * **[07:45](#t=07:45)** JSON/HTML based on accept header.
    * **[08:17](#t=08:17)** Different encoding.
* **[08:26](#t=08:26)** [Content negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation).
* **[08:54](#t=08:54)** The solutions.
    * **[09:04](#t=09:04)** Provide different URLs/Query parameter.
    * **[11:19](#t=11:19)** Don’t cache the page, cache the data based on query.
    * **[15:01](#t=15:01)** Implement a “Cache Key” - one render for every option.
    * [Netlify](https://www.netlify.com/blog/netlify-cache-key-variations/)
    * [Fastly](https://www.fastly.com/blog/getting-most-out-vary-fastly)
    * [Cloudflare](https://developers.cloudflare.com/cache/how-to/cache-keys/)
    * **[18:17](#t=18:17)** Use edge logic.
    * **[19:52](#t=19:52)** Just do it client-side.

### Hit us up on Socials!

Syntax: [X](https://twitter.com/syntaxfm) [Instagram](https://www.instagram.com/syntax_fm/) [Tiktok](https://www.tiktok.com/@syntaxfm) [LinkedIn](https://www.linkedin.com/company/96077407/admin/feed/posts/) [Threads](https://www.threads.net/@syntax_fm)

Wes: [X](https://twitter.com/wesbos) [Instagram](https://www.instagram.com/wesbos/) [Tiktok](https://www.tiktok.com/@wesbos) [LinkedIn](https://www.linkedin.com/in/wesbos/) [Threads](https://www.threads.net/@wesbos)

Scott:[X](https://twitter.com/stolinski) [Instagram](https://www.instagram.com/stolinski/) [Tiktok](https://www.tiktok.com/@stolinski) [LinkedIn](https://www.linkedin.com/in/stolinski/) [Threads](https://www.threads.net/@stolinski)

Randy: [X](https://twitter.com/randyrektor) [Instagram](https://www.instagram.com/randyrektor/) [YouTube](https://www.youtube.com/@randyrektor) [Threads](https://www.threads.net/@randyrektor)
