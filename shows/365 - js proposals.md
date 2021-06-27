---
number: 365
title: Hasty Treat - Seven Interesting JavaScript Proposals - Async Do, JSON Modules, Immutable Array Methods, and More!
date: 1624885200043
url: https://traffic.libsyn.com/syntax/Syntax365.mp3
---

In this Hasty Treat, Scott and Wes talk about seven new JavaScript proposals — what they do, where they're at, and how you might use them.

## Deque - Sponsor
Deque’s axe DevTools makes accessibility testing easy and doesn’t require special expertise. Find and fix issues while you code. Get started with a free trial of axe DevTools Pro at [deque.com/syntax](https://www.deque.com/syntax). No credit card needed.

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes
03:32 - Seven new JavaScript proposals
* [https://github.com/tc39/proposals](https://github.com/tc39/proposals)

06:25 - JSON Modules 
* [https://github.com/tc39/proposal-json-modules](https://github.com/tc39/proposal-json-modules)
* Builds on the import assertions
* No named exports
* Not executed, to avoid security issues
* Not in Node yet

09:55 - Array Find From Last
* [https://github.com/tc39/proposal-array-find-from-last](https://github.com/tc39/proposal-array-find-from-last)
* The problem: you need to group together async code.The only way to do that right now is to wrap it in a function.

11:40 - Async Do
* [https://github.com/tc39/proposal-async-do-expressions](https://github.com/tc39/proposal-async-do-expressions) 
* Async do will allow you to group together a block of code and mark it as async.
* No need for an iife
* Downside to this is that it's a code block, so if you need to return any values, you'll need to jump that up a scope level.

```jsx
Promise.all([
  async do {
    let result = await fetch('thing A');
    await result.json();
  },
  async do {
    let result = await fetch('thing B');
    await result.json();
  },
]).then(([a, b]) => console.log([a, b]));
```

14:33 - Change Array By Copy
* [https://github.com/tc39/proposal-change-array-by-copy](https://github.com/tc39/proposal-change-array-by-copy)
* Like old array methods, but returns a new array rather than mutating

17:48 - Temporal
* [https://github.com/tc39/proposal-temporal](https://github.com/tc39/proposal-temporal) 
* Stage 3, looking good!
* Amazing, large, very good Date API
* [Syntax 295: Hasty Treat — Temporal Date Objects in JavaScript](https://syntax.fm/show/295/hasty-treat-temporal-date-objects-in-javascript)

18:35 - As Patterns
* [https://github.com/zkat/proposal-as-patterns](https://github.com/zkat/proposal-as-patterns) 
* Scott don't get it
* Stage 0
* when ([ 'go', ('north' | 'east' | 'south' | 'west') as dir ]) { … }

20:47 - Pattern Matching
* [https://github.com/tc39/proposal-pattern-matching](https://github.com/tc39/proposal-pattern-matching)
* VERY Rust-like
  * [https://doc.rust-lang.org/1.6.0/book/patterns.html](https://doc.rust-lang.org/1.6.0/book/patterns.html)
* Stage 1

```jsx
<Fetch url={API_URL}>
  {props => match (props) {
    when ({ loading }) { <Loading />; }
    when ({ error }) { <Error error={error} />; }
    when ({ data }) { <Page data={data} />; }
  }}
</Fetch>
```

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets