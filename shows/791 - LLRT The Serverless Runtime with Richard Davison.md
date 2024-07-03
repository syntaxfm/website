---
number: 791
title: LLRT The Serverless Runtime w/ Richard Davison
date: 1720177200000
url: https://traffic.libsyn.com/syntax/Syntax_-_791.mp3
youtube_url: https://www.youtube.com/watch?v=DfY1_6uBdSE
guest:
  name: Richard Davison
  github: richarddd
  of: Amazon Web Services (AWS)
  url: https://aws.amazon.com/
  social: https://www.linkedin.com/in/richard-davison-992462101/
---

Scott and Wes chat with Richard Davison from AWS about LLRT, a new runtime tailored specifically for Lambda. They dive into the benefits of using LLRT, challenges with JavaScript in serverless, and why Rust was chosen for its development.

### Show Notes

* **[00:00](#t=00:00)** Welcome to Syntax!
* **[01:07](#t=01:07)** Who is Richard Davison?
* **[05:11](#t=05:11)** What is LLRT and what’s the motivation for building it?
* **[08:25](#t=08:25)** AWS Lambda example.
* **[11:20](#t=11:20)** What makes LLRT specifically tailored to Lambda?
* **[14:55](#t=14:55)** Brought to you by [Sentry.io](https://sentry.io/syntax).
* **[15:22](#t=15:22)** [Node.js in Lambda](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html).
* **[16:00](#t=16:00)** What are some challenges that people have with JavaScript in serverless?
* **[17:20](#t=17:20)** Lambda memory configuration.
* **[19:23](#t=19:23)** Managing cost of compute.
* **[21:29](#t=21:29)** Simpler and faster than Node, Bun, Dino, but not a replacement.
* **[22:31](#t=22:31)** The benchmarks.
* **[27:00](#t=27:00)** Quick.js, the main reason for the performance gains.
  * [Fabrice Bellard QuickJS](https://bellard.org/quickjs/).
* **[28:03](#t=28:03)** The Quick.js engine.
* **[30:35](#t=30:35)** What was the reason behind creating Quick.js?
* **[33:46](#t=33:46)** What made you pick Rust for LLRT?
* **[36:34](#t=36:34)** Abstractions and the value of speed.
* **[39:08](#t=39:08)** The [JIT Compiler](https://www.ibm.com/docs/en/sdk-java-technology/8?topic=reference-jit-compiler).
* **[42:38](#t=42:38)** Compile cache.
* **[43:27](#t=43:27)** De-optimizations.
* **[44:59](#t=44:59)** Node.js Compat, what to use and avoid with LLRT.
  * [GitHub AWS Labs Compatibility Chart](https://github.com/awslabs/llrt?tab=readme-ov-file#compatibility-matrix).
* **[47:52](#t=47:52)** Will you target with [WinterCG](https://wintercg.org/) spec?
* **[50:22](#t=50:22)** [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API).
* **[52:06](#t=52:06)** What about WebSockets?
* **[53:10](#t=53:10)** Is this going to be promoted from a labs project?
* **[54:49](#t=54:49)** Sick Picks + Shameless Plugs.

### Sick Picks

- Richard: [QuickJS Engine](https://bellard.org/quickjs/), [JSLinux](https://bellard.org/jslinux/).

### Shameless Plugs

- Richard: Javascript

### Hit us up on Socials!

Syntax: [X](https://twitter.com/syntaxfm) [Instagram](https://www.instagram.com/syntax_fm/) [Tiktok](https://www.tiktok.com/@syntaxfm) [LinkedIn](https://www.linkedin.com/company/96077407/admin/feed/posts/) [Threads](https://www.threads.net/@syntax_fm)

Wes: [X](https://twitter.com/wesbos) [Instagram](https://www.instagram.com/wesbos/) [Tiktok](https://www.tiktok.com/@wesbos) [LinkedIn](https://www.linkedin.com/in/wesbos/) [Threads](https://www.threads.net/@wesbos)

Scott: [X](https://twitter.com/stolinski) [Instagram](https://www.instagram.com/stolinski/) [Tiktok](https://www.tiktok.com/@stolinski) [LinkedIn](https://www.linkedin.com/in/stolinski/) [Threads](https://www.threads.net/@stolinski)

Randy: [X](https://twitter.com/randyrektor) [Instagram](https://www.instagram.com/randyrektor/) [YouTube](https://www.youtube.com/@randyrektor) [Threads](https://www.threads.net/@randyrektor)
