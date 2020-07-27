---
number: 270
title: Meteor's 2nd Life
date: 1596027600426
url: https://traffic.libsyn.com/syntax/Syntax270.mp3
---

In this episode of Syntax, Scott and Wes talk with Filipe Névola about Meteor and the exciting things happening in the Meteor world!

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Sentry - Sponsor
If you want to know what's happening with your errors, track them with [Sentry](https://sentry.io/). Sentry is open-source error tracking that helps developers monitor and fix crashes in real time. Cut your time on error resolution from five hours to five minutes. It works with any language and integrates with dozens of other services. Syntax listeners can get two months for free by visiting [Sentry.io](https://sentry.io/) and using the coupon code "tastytreat".

## Guests
* [Filipe Névola](https://blog.meteor.com/@filipenevola)
* [@filipenevola](https://twitter.com/filipenevola)

## Show Notes

01:20 - What is your background?

03:41 - What exactly is Meteor?

12:00 - What are the biggest misconceptions of modern meteor?

18:20 - What do you say to people who think Meteor is dead?

21:33 - How does data get from your Meteor into your React app?

* Example of getting data on client side

```jsx
import { useTracker } from 'meteor/react-meteor-data'

// Hook, basic use, everything in one component
const MyProtectedPage = (pageId) => {
  const { user, isLoggedIn, page } = useTracker(() => {
    // The publication must also be secure
    const subscription = Meteor.subscribe('page', pageId)
    const page = Pages.findOne({ _id: pageId })
    const user = Meteor.user()
    const userId = Meteor.userId()
    const isLoggingIn = Meteor.loggingIn()
    return {
      page,
      isLoading: !subscription.ready(),
      user,
      userId,
      isLoggingIn,
      isLoggedIn: !!userId
    }
  }, [pageId])
  
  if (!isLoggedIn) {
    return <div>
      <Link to="/register">Create an Account</Link>
      <Link to="/login">Log in</Link>
    </div>
  }
  
  return <div>
    <h1>{page.title}</h1>
    <p>{page.content}</p>
    <a href="#" onClick={(e) => { e.preventDefault(); Meteor.logout(); }}>Log out ({user.username})</a>
  </div>
}
```

27:50 - What do you think is the ideal usecase for Meteor?

31:09 - Why did Meteor 1.0 fail to maintain hype?

36:41 - What does Meteor's future look like?

45:27 - Are there any plans to integrate serverless into Meteor?

46:55 - Any little known features of Meteor that people might be interested in?

## Links
* [Meteor](https://www.meteor.com/)
* [Tiny Capital](https://www.tinycapital.com/)
* [Deno](https://deno.land/)
* [Meteor Galaxy](https://www.meteor.com/hosting)
* [Mongoose](https://mongoosejs.com/)
* [Parcel](https://parceljs.org/)
* [Apollo](https://www.apollographql.com/)
* [MongoDB](https://www.mongodb.com/)
* [Svelte](https://svelte.dev/)
* [Meteor repo](https://github.com/meteor/meteor)
* [Meteor Up](http://meteor-up.com/)
* [https://howtocreateanapp.dev/](https://howtocreateanapp.dev/)
* [https://www.youtube.com/channel/UC8A0hHUaCBvuBs0eA5g_q3A](https://www.youtube.com/channel/UC8A0hHUaCBvuBs0eA5g_q3A)
* [Cordova](https://cordova.apache.org/)
* [Missive](https://missiveapp.com/)
* [Meteor Forums](https://forums.meteor.com/)

## ××× SIIIIICK ××× PIIIICKS ×××
* Filipe:
  * 1: [Galaxy](https://www.meteor.com/hosting)
  * 2: [Terere](https://www.196flavors.com/paraguay-terere/)
* Scott: [Amplifi Alien Router](https://amplifi.com/alien)
* Wes: [Parcel - Global Package Tracking](https://parcelapp.net/)

## Shameless Plugs
* Filipe: [@filipenevola](https://twitter.com/filipenevola)
* Scott: [All Courses](https://www.leveluptutorials.com/pro) - Sign up for the year and save 25%!
* Wes: [All Courses](https://wesbos.com/courses/) - Use the coupon code 'Syntax' for $10 off!

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets