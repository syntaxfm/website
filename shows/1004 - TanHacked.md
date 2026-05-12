---
number: 1004
title: TanHacked
date: 1778670000000
url: https://traffic.megaphone.fm/FSI1796633736.mp3
youtube_url: https://www.youtube.com/watch?v=kYqpxJE4DyE
---
	
Scott and Wes break down the "Mini Shai-Hulud" supply chain attack that compromised TanStack and other popular npm packages through a clever GitHub Actions cache poisoning exploit; a self-propagating worm that stole credentials and persisted through Claude Code hooks and VS Code tasks. They also cover how developers can protect themselves using pnpm's security defaults, dev containers, and other practical defenses.

### Show Notes

* **[00:00](#t=00:00)** Welcome to Syntax!
* **[00:25](#t=00:25)** Understanding the [Shai-Hulud Worm](https://www.wiz.io/blog/shai-hulud-npm-supply-chain-attack)
  * [Post Mortem of Shai Hulud Attack](https://posthog.com/blog/nov-24-shai-hulud-attack-post-mortem)
* **[02:47](#t=02:47)** Mechanics of the Attack: GitHub Actions and Cache
  * [How the attack happened](https://x.com/sebastienlorber/status/2054108973352038618?s=20)
  * [Who Was Involved in the Attack](https://x.com/hetmehtaa/status/2054158511073116266)
  * [Several npm latest releases are compromised](https://github.com/TanStack/router/issues/7383#issuecomment-4424629798)
  * [Socket.dev](https://socket.dev/blog/tanstack-npm-packages-compromised-mini-shai-hulud-supply-chain-attack)
  * [Step Security](https://www.stepsecurity.io/blog/mini-shai-hulud-is-back-a-self-spreading-supply-chain-attack-hits-the-npm-ecosystem)
* **[05:44](#t=05:44)** Brought to you by [Sentry.io](https://sentry.io/syntax)
* **[06:09](#t=06:09)** Propagation and Impact of the Worm
* **[09:30](#t=09:30)** Preventative Measures for Developers
  * [Dead Man’s Switch](https://x.com/dabit3/status/2053956743621648789)
* **[12:33](#t=12:33)** The Role of Package Managers in Security
  * [Block Exotic Subdeps](https://pnpm.io/settings#blockexoticsubdeps)
* **[18:39](#t=18:39)** Using Dev Containers
  * [Why You Should Use Dev Containers](https://www.youtube.com/watch?v=kPMA9cnpScU)
  * [Scott Tolinski’s Security Review](https://github.com/stolinski/s-stack/tree/main/skills/security-review)
* **[20:57](#t=20:57)** Conclusion and Final Thoughts
  * [Sentry has Skills!](https://github.com/getsentry/skills)

### Hit us up on Socials!

Syntax: [X](https://twitter.com/syntaxfm) [Instagram](https://www.instagram.com/syntax_fm/) [Tiktok](https://www.tiktok.com/@syntaxfm) [LinkedIn](https://www.linkedin.com/company/96077407/admin/feed/posts/) [Threads](https://www.threads.net/@syntax_fm)

Wes: [X](https://twitter.com/wesbos) [Instagram](https://www.instagram.com/wesbos/) [Tiktok](https://www.tiktok.com/@wesbos) [LinkedIn](https://www.linkedin.com/in/wesbos/) [Threads](https://www.threads.net/@wesbos)

Scott: [X](https://twitter.com/stolinski) [Instagram](https://www.instagram.com/stolinski/) [Tiktok](https://www.tiktok.com/@stolinski) [LinkedIn](https://www.linkedin.com/in/stolinski/) [Threads](https://www.threads.net/@stolinski)

Randy: [X](https://twitter.com/randyrektor) [Instagram](https://www.instagram.com/randyrektor/) [YouTube](https://www.youtube.com/@randyrektor) [Threads](https://www.threads.net/@randyrektor)