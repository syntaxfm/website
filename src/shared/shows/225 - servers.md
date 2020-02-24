---
number: 225
title: Hasty Treat - What makes a server fast?
date: 1582552800129
url: https://traffic.libsyn.com/syntax/Syntax225.mp3
---

In this Hasty Treat, Scott and Wes talk about how to make servers fast!

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

3:58 - Ram / Memory

* Things like variables, functions, callstacks, application cache, sessions are all stored in memory
* Large processes can eat up lots of memory
* Reading 1,000,000 lines of a CSV
* npm installing
* Swap Memory
* If your node application is limited by memory, it will crash or wait longer for memory to be freed up (garbage collection)
* Garbage collection can take up CPU resourced
* High-performance databases

7:52 - CPU

* The processor on your server - the brains of the computer
* A task - like 1 + 1, or function handleClick(), takes CPU time - the faster the processor, and the more cores it has, the faster it can think and perform these tasks
* A faster CPU means your node app will start more quickly

9:26 - GPU

* Most servers don't have a GPU
* GPUs are not only good for graphics, but they are great at solving complex tasks
* Bitcoin mining is fast on a GPU
* Machine Learning

11:47 - Disk Space

* SSD vs HDD
* The files have to be read from the hard drive and served up to the web server - the hard drive speed determines how fast they can be read, and how fast they can be written
* SSD is more expensive but makes for a much faster application
* HDD is cheaper and is better for storing larger files that aren't as time-sensitive
* An SSD will mean your node app will start faster and serve up files more quickly

## Links
* [Atlas](https://www.mongodb.com/cloud/atlas)
* [Digital Ocean](https://www.digitalocean.com/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets