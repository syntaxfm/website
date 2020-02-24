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

// use cjs to grab the data modules; rollup ignores it
let { getShowsSparse } = require('@architect/shared/shows')

// lambda function renderer logic
export async function render(req) {

  const { shows, show } = await getShowsSparse(req.params.number)
  const title = show? show.title : ''
  const jsx = <App path={req.path} params={req.params} show={show} shows={shows} />
  const main = ReactDOMServer.renderToString(jsx) 

  // todo: set cache to one day if if req.params.number defined
  return { 
    html: syntaxfm({ title, main, show, shows, path: req.path, params: req.params })
  }
}

// helper buddy to render the html envelope
function syntaxfm({ title, main, show, shows, path, params }) {
  let description = "Full Stack Developers Wes Bos and Scott Tolinski dive deep into web development topics, explaining how they work and talking about their own experiences. They cover from JavaScript frameworks like React, to the latest advancements in CSS to simplifying web tooling."
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
<section id=js-main>${ main }</section>

<script>
window.STATE = ${JSON.stringify({path, params, show, shows})}
</script>
<script type=module src=/_static/csr.js></script>
</body>
</html>`
}
