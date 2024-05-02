---
number: 170
title: State In React
date: 1565787600542
url: https://traffic.libsyn.com/syntax/Syntax170.mp3
---

In this episode of Syntax, Scott and Wes talk about state in React: local state, global state, UI state, data state, caching, API data and more!

## LogRocket - Sponsor

LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Freshbooks - Sponsor

Get a 30 day free trial of Freshbooks at [freshbooks.com/syntax](https://freshbooks.com/syntax) and put SYNTAX in the "How did you hear about us?" section.

## Show Notes

3:38 - What is state?

4:58 - What kind of things are kept in state?

* Data
    * Temporary client side data
        * From forms, button clicks, etc.
    * Cached server data
    * Data from API
* UI status
    * AKA isModalOpen
    * isToggled

12:48 - Global state vs. Local state

* Ask yourself: does the data need to be accessed outside this component?
	* If data does need to be accessed a little higher, you can simply move where that state lives. React calls this "lifting state".
* Do you count Apollo API calls as global state?

21:15 - Managing Local state

* useState, setState
* Passing state & update functions down
* State machines

31:12 - Approaches to Global state

* Redux
    * Complicated, hard to learn
    * Very useful, organized and structured
    * Actions, reducers and more
    * Time traveling do to nature of store
    * Immutability
    * Tons of Redux based hooks libs
* Mobx
    * Based on Observables
        * An Observable is like a Stream and allows to pass zero or more events where the callback is called for each event. Often Observable is preferred over Promise because it provides the features of Promise and more.
* Context
    * Functions just work and update global state.
    * Downside is there are no fancy tools

* Apollo
    * Apollo quires for data in global cache
    * Apollo client for global UI state
        * Not quite there, isn't super elegant

## Links
* [Thinkso](https://thinkso.com/)
* [Learn Node!](https://wesbos.com/learn-node/)
* [Meteor Session](https://docs.meteor.com/api/session.html)
* [xstate-react](https://github.com/davidkpiano/xstate/tree/master/packages/xstate-react#readme)
* [React Context](https://reactjs.org/docs/context.html)
* [Mobx](https://mobx.js.org/)
* [easy-peasy](https://github.com/ctrlplusb/easy-peasy)
* [hype.codes](https://hype.codes/)
* [providerCompose.js](https://gist.github.com/stolinski/2d9545e19dd67bda64143cb1aae04ac0)
* [Relay](https://relay.dev/)
* [React Podcast](https://reactpodcast.simplecast.fm/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Command Line Heroes](https://www.redhat.com/en/command-line-heroes)
* Wes: [Massdrop Ctrl Mechanical Keyboard](https://drop.com/buy/massdrop-ctrl-mechanical-keyboard)

## Shameless Plugs
* Scott: [LevelUpTutorials - Gatsby Ecommerce](https://www.leveluptutorials.com/pro) — Subscribe before price goes up!
* Wes: [All Courses](https://wesbos.com/courses/) — Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets