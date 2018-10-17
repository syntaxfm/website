import Head from 'next/head';
import stylesheet from '../styles/style.styl';
import slug from 'speakingurl';

export default ({ show, baseURL, title }) => (
  <div>
    <Head>
      <html lang="en"/>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      {show ? <meta property="og:audio" content={show.url} /> : null }
      {show ? <meta property="og:audio:secure_url" content={show.url} /> : null }
      {show ? <meta property="og:audio:type" content="audio/mp3" /> : null }
      {show ? <meta property="og:type" content="music.song" /> : null }
      {show ? <meta property="og:title" content={`${show.title} — Syntax Podcast ${show.displayNumber}`} /> : null }
      {show ? <meta property="og:description" content="Full Stack Developers Wes Bos and Scott Tolinski dive deep into web development topics, explaining how they work and talking about their own experiences. They cover from JavaScript frameworks like React, to the latest advancements in CSS to simplifying web tooling." /> : null }
      {show ? <meta property="og:url" content={`${baseURL}/show/${show.displayNumber}/${slug(show.title)}`} /> : null }
      {show ? <meta property="og:image" content={`${baseURL}/static/syntax-banner.png`} /> : null }
      <link rel="shortcut icon" href={`/static/favicon.png`} />
      <title>
        {title || `${show.title} — Syntax Podcast ${show.displayNumber}`}
      </title>
      <style dangerouslySetInnerHTML={{ __html: stylesheet.replace(/\n/g, '') }} />
    </Head>
  </div>
);
