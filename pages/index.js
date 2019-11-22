import { withRouter } from 'next/router';
import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import ShowList from '../components/ShowList';
import ShowNotes from '../components/ShowNotes';
import Player from '../components/Player';
import Meta from '../components/meta';
import Page from '../components/Page';
import getBaseURL from '../lib/getBaseURL';

export default withRouter(
  class IndexPage extends React.Component {
    static propTypes = {
      router: PropTypes.object.isRequired,
      shows: PropTypes.array.isRequired,
      baseURL: PropTypes.string.isRequired,
    };

    constructor(props) {
      super();
      const currentShow =
        props.router.query.number || props.shows[0].displayNumber;

      // Get the current episode queue or initialize it if it doesnt exist
      let currentQueue = []
      if(typeof window !== "undefined") {
        const episodeQueueString = localStorage.getItem("episodeQueue")
        currentQueue = JSON.parse(episodeQueueString)
      }

      this.state = {
        currentShow,
        currentPlaying: currentShow,
        currentQueue,
      };
    }

    static async getInitialProps({ req }) {
      const baseURL = getBaseURL(req);
      const { data: shows } = await axios.get(`${baseURL}/api/shows`);
      return { shows, baseURL };
    }

    componentWillReceiveProps(nextProps) {
      const { query } = nextProps.router;
      if (query.number) {
        this.setState({ currentShow: query.number });
      }
    }

    setCurrentPlaying = (currentPlaying) => {
      console.log('Setting current playing');
      this.setState({ currentPlaying });
    };

    addShowToQueue = (show) => {
      console.log(`Added ${show} to queue`)
      const newQueue = [...this.state.currentQueue, show]
      this.setState({
        currentQueue: newQueue
      })
      if (typeof window !== 'undefined') {
        localStorage.setItem("episodeQueue", JSON.stringify(newQueue));
      }
    }

    removeShowFromQueue = (show) => {
      console.log(`Removing ${show} from queue`)
      const newQueue = this.state.currentQueue.filter(queueItem => queueItem !== show);
      this.setState({
        currentQueue: newQueue
      })
      if (typeof window !== 'undefined') {
        localStorage.setItem("episodeQueue", JSON.stringify(newQueue));
      }
    }

    render() {
      const { shows = [], baseURL } = this.props;
      const { currentShow, currentPlaying } = this.state;
      // Currently Shown shownotes
      const show =
        shows.find(showItem => showItem.displayNumber === currentShow) ||
        shows[0];
      // Currently Playing
      const current =
        shows.find(showItem => showItem.displayNumber === currentPlaying) ||
        shows[0];

      return (
        <Page>
          <Meta show={show} baseURL={baseURL} />
          <div className="wrapper">
            <main className="show-wrap" id="main" tabIndex="-1">
              <Player
               show={current}
               currentQueue={this.state.currentQueue}
               removeShowFromQueue={this.removeShowFromQueue}
               setCurrentPlaying={this.setCurrentPlaying}
              />
              <ShowList
                shows={shows}
                currentShow={currentShow}
                currentPlaying={currentPlaying}
                setCurrentPlaying={this.setCurrentPlaying}
                addShowToQueue={this.addShowToQueue}
                currentQueue={this.state.currentQueue}
                removeShowFromQueue={this.removeShowFromQueue}
              />
              <ShowNotes
                show={show}
                setCurrentPlaying={this.setCurrentPlaying}
              />
            </main>
          </div>
        </Page>
      );
    }
  }
);
