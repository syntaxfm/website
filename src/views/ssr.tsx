// builtins
import { join } from 'path'
import { readFile } from 'fs'
import { promisify } from 'util'

// deps
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import slug from 'speakingurl'

//@ts-ignore
import style from './styles/style.styl' 
import App from './app'

// use cjs to grab the data modules
let { getShow, getShows, getSickPicks } = require('@architect/shared/shows')

// lambda function renderer logic
export async function render(req) {
  const shows = await getShows()
  const jsx = <App path={req.path} params={req.params} query={req.query} shows={shows} />
  const title = 'my tmp title here'
  const show = 'my tmp show here'
  const main = ReactDOMServer.renderToString(jsx)
  return { 
    html:  await syntaxfm({ title, show, main })
  }
}

// heler to render the html envelope
async function syntaxfm({ title, main, show }) {
  let description = "Full Stack Developers Wes Bos and Scott Tolinski dive deep into web development topics, explaining how they work and talking about their own experiences. They cover from JavaScript frameworks like React, to the latest advancements in CSS to simplifying web tooling."
  //if (css.length === 0)
  //  css = (await promisify(readFile)(join(__dirname, 'ssr.css'))).toString().replace(/\n/g, '')
  let meta = ''
  if (show) {
    meta += `<meta property=og:audio content=${ show.url }>`
    meta += `<meta property=og:audio:secure_url content=${ show.url }>`
    meta += `<meta property=og:audio:type content=audio/mp3>`
    meta += `<meta property=og:type content=music.song>`
    meta += `<meta property=og:title content="${ show.title } — Syntax Podcast ${ show.displayNumber }}">`
    meta += `<meta property=og:url content=/show/${ show.displayNumber }/${ slug(show.title) }">`
  }
  return `<!doctype html>
<html lang=en>
<head>
<title>${ title } - Syntax Podcast ${ show? show.displayNumber || '' : '' }</title>
${ meta }
<meta name=viewport content=width=device-width,initial-scale=1>
<meta name=description content="${ description }">
<meta name=theme-color content=#F1C15D>
<meta charSet=utf-8>
<meta property=og:description content="${ description }">
<meta property=og:image content=/_static/static/syntax-banner.png>
<link rel="shortcut icon" href=/_static/static/favicon.png>
<style>${ style }</style>
</head>
<body>
<main>${ main }<main>
<script type=module src=/_static/index.js></script>
</body>
</html>`
}
