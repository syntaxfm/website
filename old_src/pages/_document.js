import Document, { Html, Head, Main, NextScript } from 'next/document';
import packageInfo from '../package.json';
import stylesheet from '../styles/style.styl';

class SyntaxDocument extends Document {
  render() {
    return (
      <Html lang="en" data-siiiiiiiiiiiiiiiiick="PFOXP PD125">
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="code" content="FQ2QP" />
          <meta name="description" content={packageInfo.description} />
          <meta name="theme-color" content="#FABF46" />
          <meta charSet="utf-8" />
          <meta property="og:description" content={packageInfo.description} />
          <meta
            property="og:image"
            content="https://syntax.fm/static/syntax-banner.png"
          />
          <link rel="icon" href="https://syntax.fm/static/favicon.png" />
          <style
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: stylesheet.replace(/\n/g, '') }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default SyntaxDocument;
