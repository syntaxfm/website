import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import ShowList from '../components/ShowList';
import ShowNotes from '../components/ShowNotes';
import Player from '../components/Player';
import Meta from '../components/meta';
import Page from '../components/Page';

export default class IndexPage extends React.Component {
  constructor(props) {
    super();
    const currentShow = props.url.query.number || props.shows[0].displayNumber;

    this.state = {
      currentShow,
      currentPlaying: currentShow,
    };

    this.setCurrentPlaying = this.setCurrentPlaying.bind(this);
  }

  static async getInitialProps({ req }) {
    let protocol;
    if (req && req.headers.host.indexOf('syntax.fm') > -1) {
      protocol = 'https';
    } else if (req) {
      // eslint-disable-next-line prefer-destructuring
      protocol = req.protocol;
    } else {
      protocol = '';
    }
    const baseURL = req
      ? `${protocol}://${req.headers.host}`
      : window.location.origin;
    const { data: shows } = await axios.get(`${baseURL}/api/shows`);
    return { shows, baseURL };
  }

  componentWillReceiveProps(nextProps) {
    const { query } = nextProps.url;
    if (query.number) {
      this.setState({ currentShow: query.number });
    }
  }

  setCurrentPlaying(currentPlaying) {
    console.log('Setting current playing');
    this.setState({ currentPlaying });
  }

  render() {
    const { shows = [], baseURL } = this.props;
    const { currentShow, currentPlaying } = this.state;
    // Currently Shown shownotes
    const show = shows.find(showItem => showItem.displayNumber === currentShow);
    // Currently Playing
    const current = shows.find(showItem => showItem.displayNumber === currentPlaying);
    return (
      <Page>
        <Meta show={show} baseURL={baseURL} />
        <div className="wrapper">
          <main className="show-wrap" id="main" tabIndex="-1">
            <Player show={current} />
            <ShowList
              shows={shows}
              currentShow={currentShow}
              currentPlaying={currentPlaying}
              setCurrentPlaying={this.setCurrentPlaying}
            />
            <ShowNotes show={show} setCurrentPlaying={this.setCurrentPlaying} />
          </main>
        </div>
      </Page>
    );
  }
}

IndexPage.propTypes = {
  url: PropTypes.string,
  shows: PropTypes.arrayOf(PropTypes.object),
  baseURL: PropTypes.string,
};

IndexPage.defaultProps = {
  url: '',
  shows: [],
  baseURL: '',
};
