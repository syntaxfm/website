---
number: 891
title: Light and Dark Mode
date: 1744023600000
url: https://traffic.libsyn.com/syntax/Syntax_-_891.mp3
youtube_url: https://www.youtube.com/watch?v=SrDQyiaf9ls
---
	
Light mode? Dark mode? Scott and Wes break down the best ways to implement theme switching in CSS, from prefers-color-scheme to manual overrides. Plus, tips on handling shadows, icons, and the dreaded flash of dark mode!

### Show Notes

* **[00:00](#t=00:00)** Welcome to Syntax!
* **[01:05](#t=01:05)** Brought to you by [Sentry.io](https://sentry.io/syntax).
* **[02:06](#t=02:06)** Light and dark mode, things to consider.
* **[02:31](#t=02:31)** Light and dark mode from scratch.
  * [drop-in.css](https://github.com/stolinski/drop-in/blob/main/packages/graffiti/drop-in.css).
  * **[04:41](#t=04:41)** Calculations vs assigned color.
  * **[05:32](#t=05:32)** color-mix and relative color.
  * **[08:15](#t=08:15)** Foreground and background variables.
    * --tint-or-shade: color-mix(in oklab, var(--fg), transparent 95%);
    * --tint-or-shade-harder: color-mix(in oklab, var(--fg), transparent 90%);
  * **[09:13](#t=09:13)** Setting color scheme.
  * **[12:38](#t=12:38)** light-dark function in CSS.
* **[15:48](#t=15:48)** Manually setting dark mode.
  * **[18:43](#t=18:43)** The challenges with shared caching.
  * **[19:33](#t=19:33)** Tailwind CSS implementation.
    * [Tailwind dark-mode](https://tailwindcss.com/docs/dark-mode).
* **[19:52](#t=19:52)** Shoehorning in dark mode.
* **[22:25](#t=22:25)** Other things to consider.
  * **[22:28](#t=22:28)** Color contrast.
    * [Lea Verou contrast-color](https://lea.verou.me/blog/2024/contrast-color/).
  * **[24:39](#t=24:39)** Logos.
  * **[25:22](#t=25:22)** Icons and images.
  * **[26:20](#t=26:20)** Accessibility.
    * [Polypane](https://polypane.app/).

### Hit us up on Socials!

Syntax: [X](https://twitter.com/syntaxfm) [Instagram](https://www.instagram.com/syntax_fm/) [Tiktok](https://www.tiktok.com/@syntaxfm) [LinkedIn](https://www.linkedin.com/company/96077407/admin/feed/posts/) [Threads](https://www.threads.net/@syntax_fm)

Wes: [X](https://twitter.com/wesbos) [Instagram](https://www.instagram.com/wesbos/) [Tiktok](https://www.tiktok.com/@wesbos) [LinkedIn](https://www.linkedin.com/in/wesbos/) [Threads](https://www.threads.net/@wesbos)

Scott: [X](https://twitter.com/stolinski) [Instagram](https://www.instagram.com/stolinski/) [Tiktok](https://www.tiktok.com/@stolinski) [LinkedIn](https://www.linkedin.com/in/stolinski/) [Threads](https://www.threads.net/@stolinski)

Randy: [X](https://twitter.com/randyrektor) [Instagram](https://www.instagram.com/randyrektor/) [YouTube](https://www.youtube.com/@randyrektor) [Threads](https://www.threads.net/@randyrektor)