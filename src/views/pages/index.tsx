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
    const currentShow = props.show.number;

    if (typeof window != 'undefined') {
      let that = this
      window.addEventListener('popstate', async function pop() {

        // grab the show path and number 
        let path = '/show/' + window.location.pathname.split('/show/')[1]
        let num = path.split('/').filter(Boolean)[1]

        // immediately render always
        that.setState({ currentShow: num })

        // @ts-ignore
        let index = window.STATE.shows.findIndex(s=> s.number == num)

        // @ts-ignore
        let cached = !!window.STATE.shows[index].html
        if (!cached) {
          let show = await fetch(`/api/shows/${num}`)
          let json = await show.json()
          // @ts-ignore
          window.STATE.show = json 
          // @ts-ignore
          window.STATE.shows[index] = json
          // render html
          that.setState({ currentShow: num })
        }
      })
    }

    this.state = {
      currentShow,
      currentPlaying: currentShow,
      isPlaying: false,
    };
  }

  setCurrentPlaying = (currentPlaying, isPlaying=false) => {
    this.setState({ currentPlaying, isPlaying });
  };

  setIsPlaying = (isPlaying) => {
    this.setState({isPlaying})
  }

  render() {
    const { shows = [] } = this.props;
    const { currentShow, currentPlaying, isPlaying } = this.state;

    // Currently Shown shownotes
    const show = shows.find(s=> s.number == currentShow) 

    // Currently Playing
    const current = shows.find(s=> s.number == currentPlaying) 

    //console.log('DEBUG', {show: show.number, current: current.number, currentShow, currentPlaying, isPlaying})

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
