---
number: 303
title: Hasty Treat - Client vs Server Data Validation
date: 1606140000666
url: https://traffic.libsyn.com/syntax/Syntax303.mp3
---

In this Hasty Treat, Scott and Wes talk about client- and server-side validation, and what each is used for!

## Netlify - Sponsor
Netlify is the best way to deploy and host a front-end website. All the features developers need right out of the box: Global CDN, Continuous Deployment, one click HTTPS and more. Hit up [netlify.com/syntax](https://netlify.com/syntax) for more info.

## Show Notes

02:49 - Wes' story

06:28 - What is the role of client-side validation?
* Help the user input the correct data as they type it.
* Show correct data in UI.
* Show correct UI.
* Just about all of these things are for the user's benefit, and how they feel when using the site.

11:10 - What is the role of server-side validation?
* Validate that all the data is correct before it's saved to the database
* Security first and foremost

15:03 - What process should a store follow to validate on the server?
1. Check that correct types are coming in. Very easy with Graphql.
2. Get current stock and price information from unique ids from the database.
3. Confirm that this information is what the user is expecting — if the UI said the user will be charged $40, don't charge them $50 just because of the updated info. In that case, send back to the user.

17:17 - What do you do if you don't want people messing with your React state?
* `@fvilers/disable-react-devtools`
* `if (process.env.NODE_ENV === 'production') disableReactDevTools()`
* We do this on LUT. Why? Because it's a deterrent.

## Links
* [uses.tech](https://uses.tech/)
* [Flipp App](https://flipp.com/home)
* [GraphQL](https://graphql.org/)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets