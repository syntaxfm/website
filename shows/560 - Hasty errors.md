---
number: 560
title: TypeScript Fundamentals × Satisfies and as const
date: 1673265600317
url: https://traffic.libsyn.com/syntax/Syntax_-_560.mp3
spotify_url: https://open.spotify.com/episode/5abW5gAdCVv9rg1ZxLu4Bp
---

In this Hasty Treat, Scott and Wes talk about Satisfies and as const.

## Show Notes

* **[00:25](#t=00:25)** Welcome
* **[02:04](#t=02:04)** Xmas recap
* [Peloton](https://www.onepeloton.com)
* **[04:09](#t=04:09)** Satisfies and as const
* **[06:16](#t=06:16)** What is const?
* **[10:30](#t=10:30)** Helping with currency
* **[12:44](#t=12:44)** Bos monster server update
* **[14:13](#t=14:13)** Satisfies

```
export const currencies = {
USD: 'US Dollars',
CAD: 'Canadian Dollar',
EUR: 'Euro',
} as const;

export type Currency = typeof currencies;
export type CurrencyCode = keyof Currency;
```

## Tweet us your tasty treats

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
