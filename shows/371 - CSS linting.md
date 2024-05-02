---
number: 371
title: Hasty Treat - Stylelint for Linting CSS
date: 1626699600669
url: https://traffic.libsyn.com/syntax/Syntax371.mp3
---

In this Hasty Treat, Scott and Wes talk about Stylelint, what it is and why you should use it!

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## Sentry - Sponsor
If you want to know what’s happening with your code, track errors and monitor performance with Sentry. Sentry’s Application Monitoring platform helps developers see performance issues, fix errors faster, and optimize their code health. Cut your time on error resolution from hours to minutes. It works with any language and integrates with dozens of other services. Syntax listeners new to Sentry can get two months for  free by visiting [Sentry.io](https://sentry.io) and using the coupon code TASTYTREAT during sign up.

## Show Notes
03:15 - What is a linter anyway? Why do you want to lint your CSS?
* Does stylelint fix errors or just tell you errors?

04:42 - Getting setup 
* .stylelintrc
* stylelint extension
* Sass 
* High perf animations
* stylelint order
* Max nesting depth
* Declaration strict value

```jsx
{
	"extends": [
		"stylelint-config-standard",
		"stylelint-config-sass-guidelines"
	],
	"plugins": [
		"stylelint-high-performance-animation",
		"stylelint-declaration-strict-value",
		"stylelint-order"
	],
	"rules": {
		"selector-no-qualifying-type": [
			true,
			{
				"ignore": [
					"attribute"
				]
			}
		],
		"plugin/no-low-performance-animation-properties": [
			true,
			{
				"ignoreProperties": [
					"color",
					"background-color",
					"box-shadow"
				]
			}
		],
		"indentation": "tab",
		"order/order": [
			"custom-properties",
			"declarations"
		],
		"order/properties-alphabetical-order": null,
		"declaration-block-no-duplicate-custom-properties": true,
		"declaration-empty-line-before": null,
		"scale-unlimited/declaration-strict-value": [
			[
				"/color$/",
				"z-index",
				"font-size"
			]
		],
		"scss/dollar-variable-pattern": "^[a-z][a-zA-Z0-9]+$",
		"max-nesting-depth": 3,
		"selector-pseudo-class-no-unknown": null
	}
}
```

## Links
* [https://github.com/stylelint/awesome-stylelint](https://github.com/stylelint/awesome-stylelint)
* [JSLint](https://www.jslint.com/)
* [JSHint](https://jshint.com/)
* [ESLint](https://eslint.org/)
* [VS Code](https://code.visualstudio.com/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets