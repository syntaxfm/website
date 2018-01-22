import React from 'react'
import Show from './Show';
import formatTime from '../lib/formatTime';

export default class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      progressTime: 50,
      playing: false,
      duration: 0,
      currentTime: this.props.time,
      playbackRate: 1
    }
  }

  timeUpdate = (e) => {

    const { currentTime = 0, duration = 0 } = e.currentTarget;
    const progressTime = (currentTime / duration) * 100;
    if (Number.isNaN(progressTime)) return;
    this.setState({ progressTime, currentTime, duration });
  }

  togglePlay = () => {
    const method = this.state.playing ? 'pause' : 'play';
    const classMethod = this.state.playing ? 'add' : 'remove';
    this.audio[method]();
  }

  scrub = (e) => {
    const scrubTime = (e.nativeEvent.offsetX / this.progress.offsetWidth) * this.audio.duration;
    localStorage.setItem('lastPlayed', JSON.stringify({podcast: this.props.show.displayNumber, lastPlayed: scrubTime}))
    this.audio.currentTime = scrubTime;
  }

  onPlayPause = (e) => {
    // localStorage.setItem('lastPlayed', JSON.stringify({podcast: this.props.show.displayNumber, lastPlayed: this.state.currentTime}))
    this.setState({ playing: !this.audio.paused });
    const method = this.audio.paused ? 'add' : 'remove';
    document.querySelector('.bars').classList[method]('bars--paused'); // 💩
  }

  volume = (e) => {
    this.audio.volume = e.currentTarget.value;
  }

  speed = (e) => {
    let playbackRate = this.state.playbackRate + 0.25;
    if (playbackRate > 2.5) {
      playbackRate = 0.75;
    }
    this.setState({ playbackRate });
  }

  componentWillUpdate(nextProps, nextState) {
    this.audio.playbackRate = nextState.playbackRate;
  }

  componentDidUpdate(prevProps, prevState) {
    localStorage.setItem('lastPlayed', JSON.stringify({podcast: this.props.show.displayNumber, lastPlayed: this.state.currentTime}))
    if(this.props.show.number !== prevProps.show.number) {
      this.audio.currentTime = this.state.currentTime
      this.audio.play();
    }
  }

  componentDidMount() {
    console.log('mounted player');
    if(!localStorage.lastPlayed) return
      const data = JSON.parse(localStorage.getItem('lastPlayed'))
      this.setState({
        currentTime: data.lastPlayed
      })
      console.log(this.state);
  }

  render() {
    console.log('player being rendered! ' + this.state.currentTime)
    const { show } = this.props;
    const { playing, progressTime, currentTime, duration } = this.state;
    return (
      <div className="player">

        <div className="player__section player__section--left">
          <button onClick={this.togglePlay}>
            <p className="player__icon">{ playing ? '❚❚' : '►' }</p>
            <p>{formatTime(currentTime)} / {formatTime(duration)}</p>
          </button>
        </div>

        <div className="player__section player__section--middle">
          <div className="progress" onClick={this.scrub} ref={(x) => this.progress = x} >
            <div className="progress__time" style={{ width: progressTime + '%'}}></div>
          </div>
          <h3 className="player__title">Playing: {show.displayNumber}: {show.title}</h3>
        </div>

        <div className="player__section player__section--right">

          <button onClick={this.speed} className="player__speed">
            <p>FASTNESS</p>
            <span className="player__speeddisplay">{this.state.playbackRate} &times; </span>
          </button>

          <div className="player__volume">
            <p>LOUDNESS</p>
            <div className="player__inputs">
              <input onChange={this.volume} type="radio" name="volume" value="0.1" id="vol10" />
              <label htmlFor="vol10">Volume Level 10/100</label>
              <input onChange={this.volume} type="radio" name="volume" value="0.2" id="vol20" />
              <label htmlFor="vol20">Volume Level 20/100</label>
              <input onChange={this.volume} type="radio" name="volume" value="0.3" id="vol30" />
              <label htmlFor="vol30">Volume Level 30/100</label>
              <input onChange={this.volume} type="radio" name="volume" value="0.4" id="vol40" />
              <label htmlFor="vol40">Volume Level 40/100</label>
              <input onChange={this.volume} type="radio" name="volume" value="0.5" id="vol50" />
              <label htmlFor="vol50">Volume Level 50/100</label>
              <input onChange={this.volume} type="radio" name="volume" value="0.6" id="vol60" />
              <label htmlFor="vol60">Volume Level 60/100</label>
              <input onChange={this.volume} type="radio" name="volume" value="0.7" id="vol70" />
              <label htmlFor="vol70">Volume Level 70/100</label>
              <input onChange={this.volume} type="radio" name="volume" value="0.8" id="vol80" />
              <label htmlFor="vol80">Volume Level 80/100</label>
              <input onChange={this.volume} defaultChecked type="radio" name="volume" value="0.9" id="vol90" />
              <label htmlFor="vol90">Volume Level 90/100</label>
              <input onChange={this.volume} type="radio" name="volume" value="1" id="vol100" />
              <label htmlFor="vol100">Volume Level 100/100</label>
            </div>
          </div>

        </div>



        <audio
          ref={(audio) => this.audio = audio}
          onPlay={this.onPlayPause}
          onPause={this.onPlayPause}
          onTimeUpdate={this.timeUpdate}
          onLoadedMetadata={this.timeUpdate}
          src={show.url}
        ></audio>

      </div>
    );
  }
}
