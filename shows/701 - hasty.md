---
number: 701
title: A11y Treats - Labels & Roles
date: 1701691200946
url: https://traffic.libsyn.com/syntax/Syntax_-_701.mp3
spotify_url: https://open.spotify.com/episode/5fS7VHeJBd178w1yD9Eyev
---

In this episode of Syntax, Wes and Scott explain ARIA, aria-label, Roles, and the overall importance of accessibility in your web projects.

### Show Notes

* **[00:25](#t=00:25)** Welcome
* **[01:18](#t=01:18)** Syntax Brought to you by Sentry
* **[01:44](#t=01:44)** What is ARIA?
* [WAI-ARIA Roles | MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
* [An in-depth guide to ARIA roles - The A11Y Project](https://www.a11yproject.com/posts/an-indepth-guide-to-aria-roles/)
* **[02:48](#t=02:48)** What is aria-label?
```
// A button with an ARIA role and label
<button role="button" aria-label="close">
  <img src="close-icon.svg" alt="">
</button>
```
* **[06:36](#t=06:36)** What's the difference between a title and aria-label on a button?
* **[08:34](#t=08:34)** Are you really going to get sued if your website isn't accessible?
* **[11:53](#t=11:53)** What are Roles for?
* **[16:33](#t=16:33)** 6 different types of Roles
* **[21:25](#t=21:25)** What is aria-labelledby?
```
<span
  role="checkbox"
  aria-checked="false"
  tabindex="0"
  aria-labelledby="tac"></span>
<span id="tac">I agree to the Terms and Conditions.</span>
```
* **[23:13](#t=23:13)** Checking your code for accessibility
* [eslint-plugin-jsx-a11y - npm](https://www.npmjs.com/package/eslint-plugin-jsx-a11y)
* [WAVE Web Accessibility Evaluation Tools](https://wave.webaim.org/)
* [Polypane](https://polypane.app/)
* **[24:31](#t=24:31)** Feedback and future show ideas

### Hit us up on Socials!

Syntax: [X](https://twitter.com/syntaxfm) [Instagram](https://www.instagram.com/syntax_fm/) [Tiktok](https://www.tiktok.com/@syntaxfm) [LinkedIn](https://www.linkedin.com/company/96077407/admin/feed/posts/) [Threads](https://www.threads.net/@syntax_fm)

Wes: [X](https://twitter.com/wesbos) [Instagram](https://www.instagram.com/wesbos/) [Tiktok](https://www.tiktok.com/@wesbos) [LinkedIn](https://www.linkedin.com/in/wesbos/) [Threads](https://www.threads.net/@wesbos)

Scott: [X](https://twitter.com/stolinski) [Instagram](https://www.instagram.com/stolinski/) [Tiktok](https://www.tiktok.com/@stolinski) [LinkedIn](https://www.linkedin.com/in/stolinski/) [Threads](https://www.threads.net/@stolinski)