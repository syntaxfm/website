import axios from 'axios';
import React, { Component } from 'react';

import Footer from '../components/Footer';
import Header from '../components/Header';
import Meta from '../components/Meta';
import Player from '../components/Player';
import ShowList from '../components/ShowList';
import ShowNotes from '../components/ShowNotes';

export default class IndexPage extends Component {
  current = this.props.url.query.number || this.props.shows[0].displayNumber;

  state = {
    playing: this.current,
    selected: this.current,
  };

  static getInitialProps = async ({ req }) => {
    const baseURL = req ? `${req.protocol}://${req.headers.host}` : location.origin;
    const { data: shows } = await axios.get(`${baseURL}/api/shows`);
    return { baseURL, shows };
  };

  componentWillReceiveProps = ({ url: { query } }) => {
    query.number && this.setState({ selected: query.number });
  };

  setPlaying = (playing) => {
    this.setState({ playing });
  };

  render = () => {
    const { baseURL, shows = [] } = this.props;
    const { playing, selected } = this.state;

    const current = shows.find(show => show.displayNumber === playing)
    const show = shows.find(show => show.displayNumber === selected);

    return (
      <div>
        <Meta baseURL={baseURL} show={show} />
        <div className="wrapper">
          <Header />
          <div className="show-wrap">
            <Player show={current} />
            <ShowList
              playing={playing}
              selected={selected}
              setPlaying={this.setPlaying}
              shows={shows}
            />
            <ShowNotes
              setPlaying={this.setPlaying}
              show={show}
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  };
}
