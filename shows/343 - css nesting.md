---
number: 343
title: Hasty Treat - CSS Nesting 1
date: 1618232400771
url: https://traffic.libsyn.com/syntax/Syntax343.mp3
---

In this Hasty Treat, Scott and Wes talk about CSS nesting — what it is, when to use it, and why. 

## Prismic - Sponsor
Prismic is a Headless CMS that makes it easy to build website pages as a set of components. Break pages into sections of components using React, Vue, or whatever you like. Make corresponding Slices in Prismic. Start building pages dynamically in minutes. Get started at [prismic.io/syntax](https://prismic.io/syntax).

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Show Notes

04:22 - What is it?
* [https://drafts.csswg.org/css-nesting-1/#nest-prefixed](https://drafts.csswg.org/css-nesting-1/#nest-prefixed)
* [https://twitter.com/argyleink/status/1371874777548267520](https://twitter.com/argyleink/status/1371874777548267520)

06:02 - Why nest?
* Easier to read
* Easier to write
* Prevents refactoring errors, allows for dry-er code. No more typing a parent div 100 times, with a possibility of screwing it up.

08:13 - When to use nesting
* Nesting is often overused
* Only nest what you would have written un-nested with a short hand (e.g. don't nest just for the sake of it)
  * .container .item {} .container .item a {}
* Use it for scoping

10:06 - Nesting prefixes
* In order to nest CSS, you must first start it with a nesting selector

```css
.tweet {
  & > p {   }
  &.media-included { color: green; }
  & + .tweet { } // sibling
  & p { } // descentang
}
```

* Component-based — tweet, card, company, Link 

```css
article{
	color: blue;
  & {
		color: red;
  }
}
```

and must be the first child of a compound selector 

12:44 - @nest rule / media queries
* Mostly just a visual way to show nested

```css
.foo {
	display: grid;
	@media(orientation: landscape) {
    & {
			grid-auto-flow: column;
		}
	}
}
```

```css
.foo {
  display: grid;

  @media (orientation: landscape) {
    & {
      grid-auto-flow: column;
    }

    @media (min-inline-size > 1024px) {
      & {
        max-inline-size: 1024px;
      }
    }
  }
}
/* equivalent to
   .foo { display: grid; }

   @media (orientation: landscape) {
     .foo {
       grid-auto-flow: column;
     }
   }

   @media (orientation: landscape) and (min-inline-size > 1024px) {
     .foo {
       max-inline-size: 1024px;
     }
   }
 */
```

16:30 - How to use nesting today
* Literally any CSS preprocessor
* PostCSS to use spec

## Links
* [Syntax 274: How does stuff get added to CSS? Adam Argyle answers!](https://syntax.fm/show/274/how-does-stuff-get-added-to-css-adam-argyle-answers)
* [Sass](https://sass-lang.com/)
* [PostCSS](https://postcss.org/)
* [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets