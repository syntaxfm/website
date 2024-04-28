---
number: 515
title: WTF Is Enhance Framework?
date: 1664193600742
url: https://traffic.libsyn.com/syntax/Syntax_-_515.mp3
spotify_url: https://open.spotify.com/episode/4V3dWd0jrycQ8SnF5cAFCp
---

In this Hasty Treat, Scott and Wes talk about a new framework called Enhance. What is Enhance and how does it differ from other new frameworks like Astro?

## Sentry - Sponsor

If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Sanity - Sponsor

Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## Show Notes

* **[00:27](#t=00:27)** Welcome
* **[01:12](#t=01:12)** Sponsor: Sentry
* **[02:06](#t=02:06)** Sponsor: Sanity
* **[03:40](#t=03:40)** What is Enhance?
* [Enhance.dev](https://enhance.dev/)
* **[06:17](#t=06:17)** Singe file components

```
export default function HelloWorld({ html, state }) {
  const { attrs } = state
  const { greeting='Hello World' } = attrs
  return html`
    <style scope="global">
      body {
        color: #222;
      }
    </style>
    <h1>${greeting}</h1>
  `
}
```

* [Astro](https://astro.build)
* **[09:23](#t=09:23)** State and Props
* **[14:01](#t=14:01)** CSS

## Tweet us your tasty treats

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
