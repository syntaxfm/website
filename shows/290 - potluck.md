---
number: 290
title: Potluck - Is Angular good? × Stencil.js × Self XSS × SVGs in React × Social Platforms for Devs × Project Handoff × Cleaning Knives × More!
date: 1602075600592
url: https://traffic.libsyn.com/syntax/Syntax290.mp3
---

It's another potluck! In this episode, Scott and Wes answer your questions about getting your first web dev job, what makes a software engineer senior, handing off projects to clients, Angular vs React, the best social platforms for devs, and more!

## Sanity - Sponsor
Sanity.io is a real-time headless CMS with a fully customizable Content Studio built in React. Get a Sanity powered site up and running in minutes at [sanity.io/create](https://www.sanity.io/create). Get an awesome supercharged free developer plan on [sanity.io/syntax](https://www.sanity.io/syntax).

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Show Notes

01:58 - You've talked a couple times in the past about the security concerns around `target="_blank"`. You mentioned how adding `rel="noopener"` and / or `rel="noreferrer"` can secure this functionality, but what's to stop a savvy person from going into the dev tools and deleting these attributes before clicking a link? Does this defeat the entire purpose or what? Surely browsers have thought of this and it's not so easy to hack?

03:48 - Why did you not mention [Stencil](https://stenciljs.com/) when talking about web-component in the last Potluck? Can I presume you have not heard of it? It is quite successful and Ionic proves it. We've been using it for two years in production. This is the only library that thought web-components through to the end. If you know it, what do you think about it and would you use it?

* Example of a stencil component:

```jsx
import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'my-first-component',
})
export class MyComponent {

  // Indicate that name should be a public property on the component
  @Prop() name: string;

  render() {
    return (
      <p>
        My name is {this.name}
      </p>
    );
  }
}
```

06:12 - Is [https://www.syntax.fm](https://www.syntax.fm/) supposed to not work? I get a 404.

07:34 - I’m wondering what advice you’d have for someone self-taught switching from a totally non-tech industry (non profit arts, in my case) where I work in a tech role. I’ve hustled and built a portfolio of projects and learned a ton from both of your courses, but I feel that my experience is seen as less valuable because I don’t work in a traditional software/web development environment. Any tips for getting over the final hurdle of getting a dev job?

11:11 - What makes a software engineer senior?

13:08 - I have a Gatsby / Netlify client project about to launch. What’s the best approach in handing over to the (non technical) client? Do I keep in my Github account and just give the client the Netlify CMS login, or create the a Github account for the client that I can access for any maintenance? What do other devs do?

17:55 - I recently blocked all cookies on my mobile browser (Google Chrome), and I noticed something weird. A couple of sites that I know for a fact to have been built using NextJS weren't working as expected (surprise surprise). They would load as usual, and after a second or so, all the content on the page disappeared, with the error message "sorry: an unexpected error has occurred". In some cases, the error was printed in the site's font, and with the same background color on the body. Why does blocking cookies do this to NextJS sites?

21:21 - How often do you make commits? I always hear, "commit often", but I am hesitant because I feel like I may change my code later on before I make a pull request? I really liked your episode on Git Fundamentals, I would love to see a tutorial/deep dive into Git workflows and practices (when to commit / how often) Should I commit even though I know what I'm working on isn't complete or I need to refactor it?? What is code review etiquette?

26:59 - Wes, how do you handle captioning and transcripts on your courses? Do you use some tool or service for that or do you do it by hand?	

31:11 - I am a recent graduate of a code school that focused on React and Rails. The company that I currently work for uses Angular for part of their stack. I eventually would like to move into a dev spot, but I am finding that Angular feels a bit stuffy and I am not as excited about it as React, Svelte, Vue, etc. I am afraid that if I dive into Angular, I will become less relevant down the road. I want to learn everything, but I only have so much time and don't want to stunt my growth as a developer. Any thoughts or advice on this would be sick!

36:38 - How do you handle SVGs in React? I know that SVGR exists, but I'd like to avoid adding another dependency if it's something I can roll on my own. In the past, I've created functions that take parameters like fill or stroke to control color, and return a string of SVG code with the arguments interpolated in. Then I place that string into a component using dangerouslySetInnerHTML. I haven't seen this method used anywhere else, and is probably not best practice. But also, it works, so maybe it's fine?

39:52 - What social media platforms should you use as a Dev? What is cool to have? What are their benefits?

48:14 - Have you tried an ultrawide monitor for coding, such as 34" or 38"? I feel the extra width would be great for a single monitor setup, but haven't been able to see one live where I live.

## Links
* [Syntax 269: Hasty Treat - Target=_blank security issue? What's the deal with noopener and noreferrer?](https://syntax.fm/show/269/hasty-treat-target-_blank-security-issue-what-s-the-deal-with-noopener-and-noreferrer)
* [Syntax 280: Potluck - RIP Firefox? × Safari × Changing Careers × Regression Testing × Google Analytics Alternatives × Malicious Github Users? × Mac vs Windows × More!](https://syntax.fm/show/280/potluck-rip-firefox-safari-changing-careers-regression-testing-google-analytics-alternatives-malicious-github-users-mac-vs-windows-more)
* [8 Mile](https://www.imdb.com/title/tt0298203/)
* [Syntax 286: Git Fundamentals](https://syntax.fm/show/286/git-fundamentals)
* [Rev](https://www.rev.com/)
* [Angular](https://angular.io/)
* [React](https://reactjs.org/)
* [Svelte](https://svelte.dev/)
* [SVGR](https://react-svgr.com/)
* [LevelUp Tuts Discord](https://discord.gg/ccMC6kB)
* [Dev.to](https://dev.to/)
* [freeCodeCamp](https://www.freecodecamp.org/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott:
  * 1: [Knife Cleaner](https://amzn.to/3cFraY8)
  * 2: [Scraper](https://amzn.to/336AvVA)
  * 3: [Chainmail Scrubber](https://amzn.to/3mZtfCY)
* Wes: [Scriptable App](https://scriptable.app/)

## Shameless Plugs
* Scott: [ReactJS For Everyone](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [Master Gatsby Course](https://mastergatsby.com/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets
