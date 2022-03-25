import Document, { Html, Head, Main, NextScript } from 'next/document';

class SyntaxDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head></Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default SyntaxDocument;
