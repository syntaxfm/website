---
number: 275
title: Hasty Treat - Gatsby Tips
date: 1597669200031
url: https://traffic.libsyn.com/syntax/Syntax275.mp3
---

In this Hasty Treat, Scott and Wes talk about tips and tricks for using Gatsby in your projects

## LogRocket - Sponsor
LogRocket lets you replay what users do on your site, helping you reproduce bugs and fix issues faster. It's an exception tracker, a session re-player and a performance monitor. Get 14 days free at [logrocket.com/syntax](https://logrocket.com/syntax).

## Show Notes

02:02 - React Helmet
* Make a re-usable SEO component that sets defaults. Spread children to override.

04:27 - When in doubt, stop the build and restart
* Gatsby clean
* Nuke node_modules + package-lock

05:34 - Use ESM to use ES Modules everywhere - share functions between gatsby-node and gatsby-browser

06:44 - Run the build command locally to troubleshoot prod
* Dev mode isn't SSG'd - people overlook this

08:06 - Wrap your layout automatically in gatsby-ssr and gatbsy-browser
* wrapPageElement and wrapRootElement

09:50 - Consider just adding the layout component manually to each page
* This will allow you to skip the layout if you need to have a page that isn't typical 

11:21 - Layout is not suitable for unmount animations
* Orchestrating individual component animations in Gatsby isn't easy, use wrapPageElement to write your animations or delays for internally unmounted components.

12:59 - use onCreatePage to pass context to the layout

```jsx
exports.onCreatePage = ({ page, actions }) => {
  const { createPage } = actions;

  if (page.path.match(/thumbnail/)) {
    page.context.layout = 'thumbnail';
    createPage(page);
  }
};
```

14:03 - You don't have to query for everything
* Hard-coding data in html/jsx is super valid

15:32 - Gatsby Parallel Runner
* For lots of images

## Links
* [Gridsom](https://gridsome.org/)
* [Google Cloud](https://cloud.google.com/)
* [Cloudinary](https://cloudinary.com/)
* [Sanity Image](https://www.sanity.io/docs/presenting-images)

## Tweet us your tasty treats!
* [Scott's Instagram](https://www.instagram.com/stolinski/)
* [LevelUpTutorials Instagram](https://www.instagram.com/LevelUpTutorials/)
* [Wes' Instagram](https://www.instagram.com/wesbos/)
* [Wes' Twitter](https://twitter.com/wesbos)
* [Wes' Facebook](https://www.facebook.com/wesbos.developer)
* [Scott's Twitter](https://twitter.com/stolinski)
* Make sure to include [@SyntaxFM](https://twitter.com/SyntaxFM) in your tweets