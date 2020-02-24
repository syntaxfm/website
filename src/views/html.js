// @ts-ignore
import slug from 'speakingurl';
import style from './styles/style.styl';

// helper buddy to render the html envelope
// accepts a plain js object and returns an html string
export default function syntaxfm({ main, show, shows, path, params }) {
  const description =
    'Full Stack Developers Wes Bos and Scott Tolinski dive deep into web development topics, explaining how they work and talking about their own experiences. They cover from JavaScript frameworks like React, to the latest advancements in CSS to simplifying web tooling.';

  return `<!doctype html>
<html lang=en>
<head>
<title>${show.title} - Syntax Podcast ${show.displayNumber}</title>
<meta property=og:audio content=${show.url}>
<meta property=og:audio:secure_url content=${show.url}>
<meta property=og:audio:type content=audio/mp3>
<meta property=og:type content=music.song>
<meta property=og:title content="${show.title} — Syntax Podcast ${
    show.displayNumber
  }}">
<meta property=og:url content=/show/${show.displayNumber}/${slug(show.title)}">
<meta name=viewport content=width=device-width,initial-scale=1>
<meta name=description content="${description}">
<meta name=theme-color content=#F1C15D>
<meta charSet=utf-8>
<meta property=og:description content="${description}">
<meta property=og:image content=/_static/static/syntax-banner.png>
<link rel="shortcut icon" href=/_static/static/favicon.png>
<style>${style}</style>
</head>
<body>
<section id=js-main>${main}</section>

<script>
window.STATE = ${JSON.stringify({ path, params, show, shows })}
</script>
<script type=module src=/_static/csr.js></script>
</body>
</html>`;
}
