# Syntax.

A tasty treats podcast for Web Developers.

This is the site that runs [Syntax.fm](https://syntax.fm) — go there to listen to it!

This site is built on React

## Requirements
- Node 10.x or higher

## Development

1. Ensure deps are installed by running `npm install`
2. Run `npm start` to preview locally
3. When you are ready for prime time, you can just submit a PR to this repo and it will be deployed once it's accepted!

<!--
notes: 
- since there is a compile step no matter what we static render dynamically and compile/deploy the renderer instead of its output
- suppose we could do a second pass and render the static pages from that
- the whole getInitialProps thing was pretty confusing userland boilerplate 
- not sure if config is better or worse now!
- better sep of concerns and more portable for sure
- add 404 page
- add tests
- fixed lint
- removed webpack/babel and replaced with rollup/typescript
- removed proptypes and used typescript interfaces instead (function components don't need this)
- no point in devDeps vs deps in the root of an achitect project. we deploy the functions code and generate the package-locks on the way up. so no need for those either (unless you want to be explicit..then generate it yourself directly and we use that)
    -->
