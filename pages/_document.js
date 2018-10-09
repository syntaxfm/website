import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

import '../styles/index';
import '../styles/_normalize';
import '../styles/_type';
import '../styles/_layout';
import '../styles/_skiplink';
import '../styles/_header';
import '../styles/_person';
import '../styles/_player';
import '../styles/_show';
import '../styles/_sponsor';

export default class MyDocument extends Document {
  static getInitialProps({ renderPage }) {
    const sheet = new ServerStyleSheet();
    const page = renderPage(App => props => sheet.collectStyles(<App {...props} />));
    const styleTags = sheet.getStyleElement();
    return { ...page, styleTags };
  }

  render() {
    return (
      <html>
        <Head>{this.props.styleTags}</Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
