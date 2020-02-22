# Syntax.

A tasty treats podcast for Web Developers.

This is the site that runs [Syntax.fm](https://syntax.fm) — go there to listen to it!

This site is built on React and Next.js

## Requirements
- Node 8.1.2 or higher

## Development

First you `npm install`

Then you `npm run dev` and visit `http://localhost:6969`.

Then you do some work.

When you are ready for prime time, you can just submit a PR to this repo and it will be deployed once it's accepted.

If you want to build your own version, just run `npm run build` and then I'd recommend deploying with `now`.


<!--
notes: 
- since there is a compile step no matter what we static render dynamically and compile/deploy the renderer instead of its output
- the whole getInitialProps thing was pretty confusing userland boilerplate 
- not sure if config is better or worse now!
- better sep of concerns and more portable for sure
- needs a 404 page
- added tests
- removed webpack/babel and replaced with rollup/typescript
- removed proptypes and used typescript interfaces instead (functioncs components don't need this)

    "autoprefixer": "9.7.1",
    "axios": "^0.19.0",
    "babel-plugin-module-resolver": "3.2.0",
    "babel-plugin-wrap-in-js": "^1.1.1",
    "glob": "7.1.6",
    "meta-marked": "^0.4.2",
    "postcss-easy-import": "3.0.0",
    "postcss-loader": "3.0.0",
    "prop-types": "^15.7.2",
    "raw-loader": "^3.1.0",
    "react": "^16.11.0",
    "react-dom": "^16.11.0",
    "react-icons": "^3.8.0",
    "speakingurl": "^14.0.1"
    "babel-eslint": "^10.0.3",
    "eslint": "^6.6.0",
    "eslint-config-airbnb": "^18.0.1",
    "eslint-config-prettier": "^6.5.0",
    "eslint-config-wesbos": "0.0.19",
    "eslint-plugin-html": "^6.0.0",
    "eslint-plugin-import": "^2.18.2",
    "eslint-plugin-jsx-a11y": "^6.2.3",
    "eslint-plugin-prettier": "^3.1.1",
    "eslint-plugin-react": "^7.16.0",
    "eslint-plugin-react-hooks": "^2.2.0",
    "prettier": "^1.19.1",
    "stylus": "^0.54.7",
    "stylus-loader": "^3.0.2"
    -->
