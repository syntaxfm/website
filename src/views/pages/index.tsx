import React from 'react';
import ShowList from '../components/ShowList';
import ShowNotes from '../components/ShowNotes';
import Player from '../components/Player';
import Page from '../components/Page';

interface IndexProps {
  show: Show;
  shows: Array<Show>;
}

interface Show {
  title: string;
  number: string;
  displayNumber: string;
  html: string;
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

    if (typeof window != 'undefined') {
      let that = this
      window.addEventListener('popstate', async function pop() {
        let path = '/show/' + window.location.pathname.split('/show/')[1]
        let num = path.split('/').filter(Boolean)[1]
        let show = await fetch(`/api/shows/${num}`)
        let json = await show.json()
        // @ts-ignore
        window.STATE.show = json 
        // @ts-ignore
        let index = window.STATE.shows.findIndex(s=> s.number == json.number)
        // @ts-ignore
        window.STATE.shows[index] = json
        that.setState({
          currentShow: ''+ json.number
        })
      })
    }

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
    const show = shows.find(s=> s.displayNumber === currentShow) || shows[0]

    //console.log(show) 
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
