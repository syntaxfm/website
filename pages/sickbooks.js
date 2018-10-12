import React from 'react';
import Page from '../components/Page';
import axios from 'axios';

export default class SponsorPage extends React.Component {
  componentDidCatch = e => {
    console.log('ERRORRRRR');
    console.log(e);
  };

  static async getInitialProps({ req }) {
    const protocol = req && req.headers.host.indexOf('syntax.fm') > -1 ? 'https' : req ? req.protocol : '';
    const baseURL = req ? `${protocol}://${req.headers.host}` : window.location.origin;
    const { data: books } = await axios.get(`${baseURL}/api/books`);
    return { books };
  }

  render() {
    const { books = {} } = this.props;
    return (
      <Page>
        <div className="wrapper wrapper--text">
          <h1>Sick Books</h1>
          <div dangerouslySetInnerHTML={{ __html: books.html }}></div>
        </div>
      </Page>
    );
  }
}
