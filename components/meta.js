import Head from 'next/head';
import stylesheet from '../styles/style.styl';

export default () => (
  <div>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      <link rel="shortcut icon" href="https://wesbos.com/wp-content/themes/wb2014/i/crown-yellow-small.png" />
      <title>Syntax. The Web Development Podcast with Scott and Wes</title>
      <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
    </Head>
  </div>
)
