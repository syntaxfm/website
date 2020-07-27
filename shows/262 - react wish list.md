---
number: 262
title: Our React Wish List
date: 1593608400843
url: https://traffic.libsyn.com/syntax/Syntax262.mp3
---

In this episode of Syntax, Scott and Wes talk about what they wish existed in React!

## DevLifts - Sponsor
Refactor your body with DevLifts. They have a few different programs: 1) [fit.start](https://devlifts.io/join/fitstart) (normally $19/month) has a few options (lean, bodyweight, and strong). Workouts are delivered via email each month, with access to a Slack community for questions and accountability. 2) Premium (normally $199/month) is a custom-tailored option, where you get your workouts and nutrition advice after answering a questionnaire. They also check in with you each week via Slack to see how it's going and make changes if necessary. Get 50% off fit.Start plans with code SYNTAX and 50% off Premium with code TASTY.

## Freshbooks - Sponsor
Get a 30 day free trial of Freshbooks at [freshbooks.com/syntax](https://freshbooks.com/syntax) and put SYNTAX in the "How did you hear about us?" section.

## Show Notes

### React

03:53 - Unmount delay for animation

06:20 - Suspense with SSR released (or not because I think they are shelving it)

* Dan's tweet: [https://twitter.com/dan_abramov/status/1259614150386425858](https://twitter.com/dan_abramov/status/1259614150386425858)

09:24 - File based components

* Like Svelte and Vue
* This would look like a file with a special scoped `<style>` tag per page.

11:50 - Prevent Default shortcuts

13:00 - No more useIsoLayoutEffect

* useLayoutEffect on SSR should just work without a custom hook
* Simple data fetching strategy based on promises

15:52 - Recommended hooks

* E.g. "here is the best way to do things"
* Official list of best practice hooks

18:25 - A good form strategy

* Bind inputs to state directly without any change handlers
* Inputs and forms all around need more magic - it's painful

20:43 - Write once deploy everywhere

* Not likely ever
* E.g. automatic transformation into react-native (obviously not going to happen)

22:28 - Compile time directives

* [https://github.com/bukharim96/directive-x](https://github.com/bukharim96/directive-x)

25:11 - Slots instead of children

* Allows for things like named slots more explicit than children

### JSX

26:44 - Removal of htmlFor, className and all other abominations of html

29:09 - Import Raact from React for JSX to work

* Soon will be fixed [https://github.com/babel/babel/pull/11154](https://github.com/babel/babel/pull/11154)
  * [react-require](https://www.npmjs.com/package/babel-plugin-react-require)

32:31 - Better conditional / if statement syntax

33:09 - Fragments by default

* Just do it for us - the error message already knows

33:54 - Automatic key ids

* If mapping an object, check for common `_id` or id

36:36 - Simple scoped CSS built in

37:29 - Short hand for props with same name is prop={prop}

39:00 - Prop interpolation without backticks: name="$first $last"

* Or just backticks without brackets name=`${first} ${last}` instead of name={`${first} ${last}`}

### Tooling

39:43 - Story for typescript/prettier/babel

40:11 - Automatic a href client side routing

41:51 - Scaffolding and component generation

## Links
* [Svelte](https://svelte.dev/)
* [Vue](https://vuejs.org/)
* [React Native](https://reactnative.dev/)
* [NativeScript](https://nativescript.org/)
* [react-spring](https://www.react-spring.io/)
* [Paul Henschel](https://twitter.com/0xca0a)
* Scream Sneeze: [https://twitter.com/morganc_smith/status/1235332301044801538](https://twitter.com/morganc_smith/status/1235332301044801538)

## ××× SIIIIICK ××× PIIIICKS ×××
* Scott: [Software Engineering Daily Podcast](https://softwareengineeringdaily.com/)
* Wes: [PicQuic Screwdriver](https://amzn.to/2MEQiC7)

## Shameless Plugs
* Scott: [Sapper For Everyone](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [Wes' New Gatsby Course](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets