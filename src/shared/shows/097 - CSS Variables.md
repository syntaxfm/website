---
number: 97
title: Hasty Treat - Uses for CSS Variables
date: 1543845600958
url: https://traffic.libsyn.com/syntax/Syntax097.mp3
---

In this Hasty Treat, Scott and Wes talk about CSS variables, a.k.a CSS Custom Properties - why you might want to use them, why they're better than various preprocessor's variables, and pitfalls to watch out for and avoid.


## Kyle Prinsloo's Freelancing & Beyond — Sponsor

Kyle Prinsloo teaches you everything you need to know about freelancing, including how to quit your job, earn a side-income and start taking control of your life. Check it out at [https://studywebdevelopment.com/freelancing](https://studywebdevelopment.com/freelancing.html) and use the coupon code "syntax" at checkout to get 25% off.

## Show Notes

3:25 - What

* `--example-name`, represent custom properties
* called using `var()`
* Overwrite with a more specific style
* Use JavaScript to append .style.setPropert(

* How are they scoped?
  * Just like normal CSS
  * Can be set on :root {}
  * Can be set on any element down

9:10 - Why

* Uses:
  * Can make more sense if used semantically
  * var(--accent) vs var(--yellow)

* Independent values for things that can’t be broken up:
  * box-shadow: 2px 2px 2px 2px red
  * transform: rotate(var(--rotate)) scale(2);

* Inline properties can be picked up by regular CSS (color, size, etc.)
  * `<p style=”--color:red;”>hey</a>`

* Themes that can easily be changed at runtime for entire app

19:15 - Calculations

* You can use them inside of calc()
* Animations

20:10 - Bummers

* Not super well supported just yet (IE 11)
* No good fallback other than manual fallback
* Syntax - Old Browsers, Fallbacks and Polyfills series
  * [Part 1](https://syntax.fm/show/083/hasty-treat-old-browsers-fallbacks-and-polyfills-part-1)
  * [Part 2](https://syntax.fm/show/085/hasty-treat-old-browsers-fallbacks-and-polyfills-part-2)
  * [Part 3](https://syntax.fm/show/087/hasty-treat-old-browsers-fallbacks-and-polyfills-part-3)
* [PostCSS Custom Properties](https://github.com/postcss/postcss-custom-properties)

## Tweet us your tasty treats!

* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
