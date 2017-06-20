import React from 'react'
import Show from './Show';
import formatTime from '../lib/formatTime';

export default class Player extends React.Component {
  constructor() {
    super();
    this.state = {
      progressTime: 50,
      playing: false,
      duration: 0,
      currentTime: 0,
      playbackRate: 1
    }
  }

  timeUpdate = (e) => {
    const { currentTime, duration } = e.currentTarget;
    const progressTime = (currentTime / duration) * 100;
    this.setState({ progressTime, currentTime, duration });
  }

  togglePlay = () => {
    const method = this.state.playing ? 'pause' : 'play';
    this.audio[method]();
  }

  scrub = (e) => {
    const scrubTime = (e.nativeEvent.offsetX / this.progress.offsetWidth) * this.audio.duration;
    this.audio.currentTime = scrubTime;
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

  render() {
    const { show } = this.props;
    const { playing, progressTime, currentTime, duration } = this.state;
    return (
      <div className="player">
        <hr/>
        <h3>Currently Playing: {show.title}</h3>

        <button onClick={this.togglePlay}>{playing ? 'Pause' : 'Play'}</button>

        <button onClick={this.speed}>{this.state.playbackRate} &times;</button>

        <div className="progress" onClick={this.scrub} ref={(x) => this.progress = x} >
          <div className="progress__time" style={{ background: 'red', width: progressTime + '%'}}>x</div>
        </div>

        <input type="range" min="0" max="1" step="0.05" onInput={this.volume} />

        <p>{formatTime(currentTime)} / {formatTime(duration)}</p>

        <audio
          ref={(audio) => this.audio = audio}
          onPlay={() => this.setState({ playing: true })}
          onPause={() => this.setState({ playing: false })}
          onTimeUpdate={this.timeUpdate}
          onLoadedMetadata={this.timeUpdate}
          controls src={show.url}></audio>
        <hr/>
      </div>
    );
  }
}
