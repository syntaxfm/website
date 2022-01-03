---
number: 419
title: JS One Liners
date: 1641211200925
url: https://traffic.libsyn.com/syntax/Syntax_-_419.mp3
---

In this Hasty Treat, Scott and Wes talk about some Javascript one liners that speed up your coding experience in one line.

## Sponsor - Linode

Whether you’re working on a personal project or managing enterprise infrastructure, you deserve simple, affordable, and accessible cloud computing solutions that allow you to take your project to the next level. Simplify your cloud infrastructure with Linode’s Linux virtual machines and develop, deploy, and scale your modern applications faster and easier. Get started on Linode today with a $100 in free credit for listeners of Syntax. You can find all the details at [linode.com/syntax](https://linode.com/syntax). Linode has 11 global data centers and provides 24/7/365 human support with no tiers or hand-offs regardless of your plan size. In addition to shared and dedicated compute instances, you can use your $100 in credit on S3-compatible object storage, Managed Kubernetes, and more. Visit [linode.com/syntax](https://linode.com/syntax) and click on the “Create Free Account” button to get started.

## Sponsor - Sentry

If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Show Notes

* **[00:24:12](#t=00:24:12)** Welcome
* **[01:24:11](#t=01:24:11)** Sponsor: Linode
* **[02:11:02](#t=02:11:02)** Sponsor: Sentry
* **[03:54:18](#t=03:54:18)** Twitter ask for One Liners
* **[04:24:05](#t=04:24:05)** Math random
`const getPsuedoID =() => Math.floor(Math.random() * 1e15);`
* **[05:43:09](#t=05:43:09)** Random color
* [Paul Irish random color](https://www.paulirish.com/2009/random-hex-color-code-snippets/)
`'#'+Math.floor(Math.random()*16777215).toString(16);`
* **[06:41:06](#t=06:41:06)** Console.log as an object.
`console.log({ dog, person });`
[VS Marketplace Link](https://marketplace.visualstudio.com/items?itemName=WooodHead.vscode-wrap-console-log-simple)
* **[08:29:17](#t=08:29:17)** Edit anything
`document.designMode = "on"`
* **[10:15:15](#t=10:15:15)** Temporal date
`export const today = Temporal.Now.plainDateISO();`
* **[11:44:05](#t=11:44:05)** Console(log)
`const myFunc = (age) ⇒ console.log(age) || updateAge()`
* **[13:26:13](#t=13:26:13)** Remove a prop
`const { propToRemove, ...rest } = obj;`
* **[15:29:01](#t=15:29:01)** PHP style debugging
`preElement.innerText =`{JSON.stringify(val, '', ' ')}`
* **[16:31:00](#t=16:31:00)** First and Last Destructure
`var {0: first, length, [length - 1]: last} = [1,2,3];`
* **[17:34:17](#t=17:34:17)** Speed up audio video
`document.querySelector('audio, video’).playbackRate = 2`
* [Overcast](https://overcast.fm)
* **[19:44:15](#t=19:44:15)** Sleep function
`let sleep = (time = 0) => new Promise(r => setTimeout(r, time))`
* **[20:26:00](#t=20:26:00)** If statements on one line
`If (!thing) return 'something'`

## Tweet us your tasty treats

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
