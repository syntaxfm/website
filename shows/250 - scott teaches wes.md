---
number: 250
title: Scott Teaches Wes Svelte and Sapper
date: 1589979600555
url: https://traffic.libsyn.com/syntax/Syntax250.mp3
---

In this episode of Syntax, Scott teaches Wes about Svelte and Sapper — general premise, best practices, and more!

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## Stackbit - Sponsor
Stackbit offers developers tools that enable things like inline content editing, live previewing of content changes, and collaboration features on your Jamstack site, without code changes. That's why Stackbit is the best way to Jamstack. [stackbit.com](stackbit.com)

## Show Notes

03:14 - General premise

* Sapper compiles away, removing framework code from build
* Component & Props based
* Easy reactivity
* Built-in tools like animation
* Template-based

07:57 - Svelte 101

* .svelte files
* Files can include `<script>`, `<style>`, and straight-up CSS
* Variables are used in templates via {var} - `<img {src} />` even works
* Import component and use just like React and Vue

10:49 - Stylin'

* All styles are scoped by default
* global() to wrap around global declarations
* Language type sass to use sass

12:22 - Reactivity

* Baked in
  * let count = 0
  * count = count + 1 will reactively update in template
  * variables are essentially state
  * $:  double = count + 2  - to create a reactive variable that updates when another variable updates
  * $: console.log(count) = will run whenever count is update a-la useEffect
  * $: if (count >10) = same... reactive if
  * `<input bind:value={name} >` updates let name in script

15:55 - Props

* Same was React, but need to be exported before they can be used
* Seems counterintuitive, but you get over it quickly
* EZ defaults `export let answer = 'a mystery';`

```jsx
<script>
import Nested from './Nested.svelte';
</script>

<Nested answer={42}/>
```

```jsx
<script>
	export let answer = 'a mystery';
</script>

<p>The answer is {answer}</p>
```

20:08 - Template logic

* If statements
{#if user._id}
{/if}

* Loops
{#each cats as kittens}

* Promise tags
```
{#await promise}
	<p>...waiting</p>
{:then number}
	<p>The number is {number}</p>
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}
```

23:12 - Events

* `<button  on:click={func} />`
* On directive
* Functions can also be inline
* Modifiers 

```
<button on:click|preventDefault={handleClick}>
	Click me
</button>
```

26:11 - Baked-in goodies

* Animation
* Dimensions 

```
<div bind:clientWidth={w} bind:clientHeight={h}><span style="font-size: {size}px">{text}</span></div>
```

* Lifecycle methods
* Advanced State Via Stores
  * A store is simply an object with a subscribe method that allows interested parties to be notified whenever the store value changes.
* import { writable } from 'svelte/store';
* export const count = writable(0);
* count.update(0)
* Slots
* React helmet like stuff, ie <svelte:head>

36:39 - Sapper

* Similar to Next.js
* Folder routes
* Static export with all of the good stuff like service workers and preloading

## Links
* [Svelte](https://svelte.dev/)
* [Sapper](https://sapper.svelte.dev/)
* [r/webdev](https://www.reddit.com/r/webdev/)
* [Vue.js](https://vuejs.org/)
* [ScottTolinski.com](https://www.scotttolinski.com/)
* [WesBos.com](https://wesbos.com/)
* [Next.js](https://nextjs.org/)
* [ScottTolinski.com Github Repo](https://github.com/stolinski/scott-2020)
* [Gatsby.js](https://www.gatsbyjs.org/)
* [Shawn Swyx](https://www.swyx.io/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Lewisia Battery Backup Solar Fountain Pump](https://amzn.to/35awXAS)
* Wes: [Firefox Containers](https://support.mozilla.org/en-US/questions/1201060)

## Shameless Plugs
* Scott: [LevelUpTuts YouTube Channel](https://www.youtube.com/user/LevelUpTuts)
* Wes: [Wes' New Website](https://wesbos.com/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
