import React from 'react'
import axios from 'axios';
import ShowList from '../components/ShowList';
import ShowNotes from '../components/ShowNotes';
import Player from '../components/Player';
import Meta from '../components/meta';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default class IndexPage extends React.Component {

  constructor(props) {
    super();
    const currentShow = props.url.query.number || props.shows[0].displayNumber;

    this.state = {
      shows: props.shows,
      currentShow,
      currentPlaying: currentShow,
      baseURL: props.baseURL
    }
  }

  static async getInitialProps({ req }) {
    const baseURL = req ? `${req.protocol}://${req.headers.host}` : window.location.origin;
    const { data:shows } = await axios.get(`${baseURL}/api/shows`);
    return { shows, baseURL };
  }

  componentWillReceiveProps(nextProps) {
    const { pathname, query } = nextProps.url
    if(query.number) {
      this.setState({ currentShow: query.number });
    }
  }

  setCurrentPlaying = (currentPlaying) => {
    console.log('Setting current playing');
    this.setState({ currentPlaying });
  }

  render() {
    const { shows = [], currentShow, currentPlaying, baseURL } = this.state;
    // Currently Shown shownotes
    const show = shows.find(show => show.displayNumber === currentShow);
    // Currently Playing
    const current = shows.find(show => show.displayNumber === currentPlaying)
    return (
      <div>
        <Meta show={show} baseURL={baseURL} />
        <div className="wrapper">
          <Header />
          <div className="show-wrap">
            <Player show={current} />
            <ShowList shows={this.state.shows} currentShow={currentShow} currentPlaying={currentPlaying} setCurrentPlaying={this.setCurrentPlaying} />
            <ShowNotes show={show} setCurrentPlaying={this.setCurrentPlaying} />
          </div>
        </div>
        <Footer />
      </div>
    )
  }
}
