---
number: 356
title: Bike Shedding — Developer Opinions Explained
date: 1622034000010
url: https://traffic.libsyn.com/syntax/Syntax356.mp3
---

In this episode of Syntax, Scott and Wes bike shed some common developer opinions.

## Prismic - Sponsor
Prismic is a Headless CMS that makes it easy to build website pages as a set of components. Break pages into sections of components using React, Vue, or whatever you like. Make corresponding Slices in Prismic. Start building pages dynamically in minutes. Get started at [prismic.io/syntax](https://prismic.io/syntax).

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Mux - Sponsor
Mux Video is an API-first platform that makes it easy for any developer to build beautiful video. Powered by data and designed by video experts, your video will work perfectly on every device, every time. Mux Video handles storage, encoding, and delivery so you can focus on building your product. Live streaming is just as easy and Mux will scale with you as you grow, whether you're serving a few dozen streams or a few million. Visit [mux.com/syntax](https://mux.com/syntax).

## Show Notes
04:27 - Event params
* e, evt, ev, or event?

06:36 - CSS variables
* —red or —primary?

09:31 - CSS colors
* [https://twitter.com/rem/status/1386694431710007298](https://twitter.com/rem/status/1386694431710007298)
* RGB, HSL, HEX?

11:52 - Default exports vs named exports

14:45 - JavaScript import ordering

17:09 - Foo / Bar / Baz in examples

21:18 - Light vs dark themes

24:00 - longVerboseNamesDescribingWhatItIsOrDoes vs x

26:54 - VScode vs WebStorm (IDE) vs Vim

31:12 - TypeScript Generics: <T> vs <ThingName>

34:39 - Indentation-base syntax
* [https://twitter.com/LeahLundqvist/status/1386693374305095680](https://twitter.com/LeahLundqvist/status/1386693374305095680)

37:37 - Max line length

40:21 - One reduce, vs multiple .map()/flat(),filter()

```jsx
async function getStatus() {

  const res = await sendCommand('AT!GSTATUS');

  const result = res.result
    .split('\n')
    .map((x: string) => x.split(`\t\t`))
    .flat()
    .filter(Boolean)
    .map((x: string) => x.trim())
    .map((x: string) => x.split(`    \t`))
    .flat()
    .filter((x: string) => x.includes(':'))
    .map((x: string) => x.split(`:`))
    .map(([prop, val]: [string, string]) => [prop, val.trim()])

  return Object.fromEntries(result);
}
```

42:50 - index.js files
* [https://twitter.com/sevilhelm/status/1386693971112562694](https://twitter.com/sevilhelm/status/1386693971112562694) 
* ComponentName.js vs ComponentName/index.js
* [https://twitter.com/rleggos/status/1386694773021552641](https://twitter.com/rleggos/status/1386694773021552641)

48:20 - Ligatures and fancy fonts
* [https://twitter.com/badsyntax/status/1386695010859507713](https://twitter.com/badsyntax/status/1386695010859507713)

50:30 - Regular functions vs anon functions in a variable vs arrow functions
* function hey() {}
* const hey = function() {}
* const hey =  () ⇒ {}

52:44 - Explicit return vs implicit return

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Ego Mower](https://amzn.to/3dUU6xv)
* Wes: [Pass-Through Socket Set](https://www.google.com/search?q=pass-through+socket+set&rlz=1C5CHFA_enUS886US886&ei=RNKpYN2MBaixggfS14voBg&oq=pass-through+socket+set&gs_lcp=Cgdnd3Mtd2l6EAMyAggAMgIIADICCAAyAggAMgQIABAeMgQIABAeMgQIABAeMgQIABAeMgQIABAeMgQIABAeOgcIABBHELADUO4bWO4bYJcgaAFwAngAgAF5iAHJAZIBAzEuMZgBAKABAaoBB2d3cy13aXrIAQjAAQE&sclient=gws-wiz&ved=0ahUKEwjdvp2l9N7wAhWomOAKHdLrAm0Q4dUDCA4&uact=5)

## Shameless Plugs
* * Scott:
  1: [Level Up Tutorials Pro Spring Sale](https://www.leveluptutorials.com/pro) - 50% off annual subscriptions!
  2: [Github Actions with Brian Douglas](https://www.leveluptutorials.com/pro)
* Wes: [All Courses](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets