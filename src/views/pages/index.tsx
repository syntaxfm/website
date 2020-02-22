import React from 'react';
import ShowList from '../components/ShowList';
import ShowNotes from '../components/ShowNotes';
import Player from '../components/Player';
import Page from '../components/Page';

interface IndexProps {
  show: string;
  shows: Array<Show>;
}

interface Show {
  displayNumber: string;
}

interface State {
  currentShow: string;
  currentPlaying: string,
  isPlaying: Boolean;
}

export default class IndexPage extends React.Component<IndexProps, State> {

  constructor(props) {
    super(props);
    const currentShow = props.show || props.shows[0].displayNumber;

    this.state = {
      currentShow,
      currentPlaying: currentShow,
      isPlaying: false,
    };
  }

  setCurrentPlaying = currentPlaying => {
    console.log('Setting current playing');
    this.setState({ currentPlaying });
  };

  setIsPlaying = (isPlaying) => {
    this.setState({isPlaying})
  }

  render() {
    const { shows = [] } = this.props;
    const { currentShow, currentPlaying, isPlaying } = this.state;
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
        <div className="wrapper">
          <main className="show-wrap" id="main">
            <Player show={current} onPlayPause={a => this.setIsPlaying(!a.paused)}/>
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
