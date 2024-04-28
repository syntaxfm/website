---
number: 470
title: I can has() new CSS Selector?!
date: 1655121600726
url: https://traffic.libsyn.com/syntax/Syntax_-_470.mp3
spotify_url: https://open.spotify.com/episode/0ziYGaacN0aXgEG2Eijaoa
---

In this Hasty Treat, Scott and Wes talk about new CSS selectors :has, :where, and :is.

## MagicBell - Sponsor

MagicBell is the the notification inbox for your product. Add a MagicBell to your product for announcements, billing, workflow, and other notifications. The free plan supports up to 100 Monthly Active Users - [use the coupon code SYNTAXFM for 10% off the first 12 months](https://www.magicbell.com).

## LogRocket - Sponsor

LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes

* **[00:25](#t=00:25)** Welcome
* **[01:19](#t=01:19)** Sponsor: MagicBell
* **[02:31](#t=02:31)** Sponsor: LogRocket
* **[03:40](#t=03:40)** Don't say stupid
* **[05:03](#t=05:03)** :Has
* [MDN :Has](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)

```
// Finds all p tags that have an anchor tag as a child
p:has(a) {}
// Can find children of parent as well
// Finds the button of a paragraph that contains an a tag 
p:has(a) button {}
// Finds all p tags that don't have an anchor tag as a child
p:not(:has(a)) {}
// Finds all p tags where a is a direct sibling
p:has(> a) {}
// would find <p><a>Hi</a></p>
// would not find <p><span><a>hi</a></span></p>
```

* **[06:13](#t=06:13)** Jargon check
* **[11:01](#t=11:01)** Some examples
* **[13:25](#t=13:25)** Nest navigations
* **[13:51](#t=13:51)** Can I use it?
* **[15:52](#t=15:52)** Is and Where
* [MDN :where](https://developer.mozilla.org/en-US/docs/Web/CSS/:where)

In the past we would write

```
header p:hover,
main p:hover,
footer p:hover {
  color: red;
  cursor: pointer;
}
```

:where is essentially a short had for making this easier considering the 2nd half of these selectors is the same. Will make your css dryer

```
:where(header, main, footer) p:hover {}
```

Also super handy in avoiding css blocks being ignored for unsupported features.

```
// Doesn't work
div:has(p), div:some_new_selector(p)

// Will still work for :has if has is supported
:where(div:has(p), div:some_new_selector(p))
```

* [When to use :Where](https://developer.mozilla.org/en-US/docs/Web/CSS/:where#examples)

## Tweet us your tasty treats

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
