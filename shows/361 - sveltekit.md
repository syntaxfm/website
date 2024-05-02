---
number: 361
title: Hasty Treat - What is SvelteKit?
date: 1623675600113
url: https://traffic.libsyn.com/syntax/Syntax361.mp3
---

In this Hasty Treat, Scott and Wes talk about SvelteKit — what it is and why you might want to use it.

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes
03:28 - What is it?
* Total platform for building [Svelte](https://svelte.dev/) apps
* Built in [Vite.js](https://vitejs.dev/)
	* Includes all of the Vite goodness but it hides behind the scenes for the most part
* Host anywhere

05:16 - Is it CSR, SSR, SSG, WTF?!
* All of the above. Uses adapters to control the output:
```jsx
kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		adapter: adapter()
}
```

09:45 - What you get out of the box
* File-based routing
* API routes
* Layouts and layout resets
* Fancy file titles [slug] __layout
* Code splitting & preloading
* [PostCSS](https://postcss.org/)
* [TypeScript](https://www.typescriptlang.org/) support

17:03 - Neat small things
* Glob import
* [https://github.com/svelte-add/svelte-add](https://github.com/svelte-add/svelte-add)

## Links
* [SvelteKit](https://kit.svelte.dev/)
* [Next.js](https://nextjs.org/)
* [Gatsby.js](https://www.gatsbyjs.com/)
* [Sapper](https://sapper.svelte.dev/)
* [tailwindcss](https://tailwindcss.com/)
* [@chriscoyier](https://twitter.com/chriscoyier)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets