---
number: 390
title: From React To SvelteKit
date: 1632315600657
url: https://traffic.libsyn.com/syntax/Syntax390.mp3
---

In this episode of Syntax, Scott talks with Wes about moving Level Up Tutorials from React to SvelteKit — why he did it, how, benefits, things to watch out for, and more!

## Prismic - Sponsor
Prismic is a Headless CMS that makes it easy to build website pages as a set of components. Break pages into sections of components using React, Vue, or whatever you like. Make corresponding Slices in Prismic. Start building pages dynamically in minutes. Get started at [prismic.io/syntax](https://prismic.io/syntax).

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Cloudinary - Sponsor
[Cloudinary](https://cloudinary.com/?utm_source=Syntax.fm&utm_medium=Podcast&utm_content=Cloudinary_Syntax_podcast) is the best way to manage images and videos in the cloud. Edit and transform for any use case, from performance to personalization, using Cloudinary’s APIs, SDKs, widgets, and integrations.

## Show Notes
07:28 - Thoughts
* Apples to oranges, so unfortunately, no super legit ability to compare.
  * SvelteKit isn't analogous with a custom React setup that uses CSR
    * SSR is usually going to be faster - we can ship less JS
    * Some big things changed beyond React → SvelteKit
      * [Apollo](https://www.apollographql.com/) → [GFetch](https://github.com/kiedtl/gfetch)
      * [Plyr](https://plyr.io/) → [Vime](https://vimejs.com/)
    * HLS starts grabbing chunks immediately, so it's hard to get accurate load time and transfer.
* Whole conversion took a couple of months.
* Hardest part was making UI choices and changes, straight-up converting components one by one wasn't actually that tough

16:14 - Converting React components to Svelte
* useState becomes just a straight-up variable
* Graphql calls were hooks now just imported generated functions
* Remove extranous fragments
* Convert {things && } to {#if thing}{/if}
* `<component hello={hello} />` becomes `<component {hello} />`

24:06 - Spark joys
* State
  * Our checkout flow became way more transparent, way easier with Svelte stores
* Render flow
  * Was never something we needed to really think about. Didn't think about memoizing, or worrying about too many renders down the line, just never needed to
* Overall developer experience
  * It's honestly a joy to work in and I don't want to go back
* Making a library
  * Package dir, new SvelteKit project, `svelte-kit package`
  * I made svelte-toy - [https://github.com/leveluptuts/svelte-toy](https://github.com/leveluptuts/svelte-toy)
  * svelte-element-query - [https://github.com/leveluptuts/Svelte-Element-Query](https://github.com/leveluptuts/Svelte-Element-Query)
  * svelte-simple-datatable fork
* Creating a sitemap was extremely easy, because of server-side routes. file.returnformat.ts ie `sitemap.xml.ts`
* CSS without a css-in-js library for scoping is a dream. CSS props are now 100% via CSS variables using the [https://svelte.dev/docs#style_props](https://svelte.dev/docs#style_props)
* Animations are all done with Svelte's internal animations lib

32:45 - Hosting
* adapter-node
* Hosted on [render.com](http://render.com) as a straight-up node process $7/m for more than enough RAM and CPU,
* Lots of other options for static, Vercel, workers whatever, I like having just a straight-up node app you can host anywhere

35:50 - Things to do
* Admin tools
  * [Pancake](https://pancake-charts.surge.sh/) lib for charts

37:00 - Challenges
* ESM is not always smooth sailin
  * Import has from 'lodash/has' didn't working in dev, but import has from 'lodash/has.js' didn't work in prod.
    * Solution was to use lodash.has as the dependency
    * Apollo included all React as a dep unless you import from @core
* TS is great, but there was once where I wanted to define the entire props ts object for a spread prop, but was not possible
* Drag animations

Cloudinary

42:46 - Wes' questions
* What about the ecosystem?
* What about forms + DOM data? 
* Serverless functions?
* Do you always bind to state? Or just access directly?
 
```jsx
formData = writable({
  title: "yo"
})

{$formData.title}

<input bind:value={formData.title} />
```

* Is it stable? 
* [Deno](https://deno.land/) - [Snel](https://crewdevio.mod.land/projects/Snel?ref=madewithsvelte.com) 

## Links
* [https://leveluptutorials.com/](https://leveluptutorials.com/)
* [https://vitejs.dev/](https://vitejs.dev/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [The Skeptics Guide To The Universe Podcast](https://www.theskepticsguide.org/podcasts/episode-844)
* Wes: [Pressure Washer Nozzle](https://amzn.to/39iGlWl)

## Shameless Plugs
* Scott: [Web Components 101](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [All Courses](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets