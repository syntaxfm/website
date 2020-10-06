import { withRouter } from 'next/router';
import ErrorPage from 'next/error';
import React from 'react';
import PropTypes from 'prop-types';
import slug from 'speakingurl';
import ShowList from '../../../components/ShowList';
import ShowNotes from '../../../components/ShowNotes';
import Player from '../../../components/Player';
import Meta from '../../../components/meta';
import Page from '../../../components/Page';
import { getShows, getShow } from '../../../lib/getShows';

export async function getStaticPaths() {
  const shows = await getShows('all');

  return {
    fallback: false,
    paths: [
      // Homepage
      {
        params: {
          number: 'latest',
          slug: 'latest',
        },
      },
      ...shows.map(show => ({
        params: {
          number: show.displayNumber,
          slug: slug(show.title),
        },
      })),
    ],
  };
}

export async function getStaticProps({ params }) {
  const shows = await getShows();
  const showNumber =
    params.number === 'latest' ? shows[0].displayNumber : params.number;
  const show = await getShow(showNumber);
  const props = show.date > Date.now() ? {} : { shows, showNumber };

  return {
    unstable_revalidate: 1,
    props,
  };
}

export default withRouter(
  class IndexPage extends React.Component {
    // eslint-disable-next-line react/static-property-placement
    static propTypes = {
      router: PropTypes.object.isRequired,
      shows: PropTypes.array,
      showNumber: PropTypes.number,
    };

    constructor(props) {
      super();
      const currentShow = props.showNumber;

      this.state = {
        currentShow,
        currentPlaying: currentShow,
        isPlaying: false,
      };
    }

    // eslint-disable-next-line react/no-deprecated
    componentWillReceiveProps(nextProps) {
      const { query } = nextProps.router;
      if (query.number) {
        this.setState({ currentShow: query.number });
      }
    }

    setCurrentPlaying = currentPlaying => {
      console.log('Setting current playing');
      this.setState({ currentPlaying });
    };

    setIsPlaying = isPlaying => {
      this.setState({ isPlaying });
    };

    render() {
      const { shows } = this.props;

      if (!shows) {
        return <ErrorPage statusCode={404} />;
      }

      const { currentShow, currentPlaying, isPlaying } = this.state;
      const show = shows.find(
        showItem => showItem.displayNumber === currentShow
      );
      const current = shows.find(
        showItem => showItem.displayNumber === currentPlaying
      );
      return (
        <Page>
          <Meta show={show} />
          <div className="wrapper">
            <main className="show-wrap" id="main" tabIndex="-1">
              <Player
                show={current}
                onPlayPause={a => this.setIsPlaying(!a.paused)}
              />
              <ShowList
                shows={shows}
                currentShow={currentShow}
                currentPlaying={currentPlaying}
                setCurrentPlaying={this.setCurrentPlaying}
                isPlaying={isPlaying}
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
