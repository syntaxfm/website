import React from 'react';

import classes from '../lib/classes';
import formatTime from '../lib/formatTime';
import Show from './Show';

export default class Player extends React.Component {
  state = {
    current: 0,
    duration: 0,
    fastness: 1,
    playing: false,
    progress: 50,
  };

  componentDidUpdate = ({ show }) => {
    if (this.props.show.number !== show.number) this.audio.play();
  };

  componentWillUpdate = (nextProps, { fastness }) => {
    this.audio.playbackRate = fastness;
  };

  handleButton = () => {
    const method = this.state.playing ? 'pause' : 'play';
    this.audio[method]();
  };

  handlePlayback = () => {
    this.setState({ playing: !this.state.playing });

    const method = this.audio.paused ? 'add' : 'remove';
    document.querySelector('.bars').classList[method]('bars--paused'); // 💩
  };

  handleScrub = ({ nativeEvent: { offsetX } }) => {
    const time = (offsetX / this.progress.offsetWidth) * this.audio.duration;
    this.audio.currentTime = time;
  }

  handleSpeed = () => {
    const fastness = this.state.fastness;
    const updated = fastness >= 2.5 ? 0.75 : fastness + 0.25;

    this.setState({ fastness: updated });
  };

  handleUpdate = ({ currentTarget: { currentTime: current = 0, duration = 0 } }) => {
    const progress = (current / duration) * 100;

    if (Number.isNaN(progress)) return;
    this.setState({ current, duration, progress });
  };

  handleVolume = ({ currentTarget: { value } }) => {
    this.audio.volume = value;
  };

  render = () => {
    const { current, duration, progress, playing } = this.state;
    const { show } = this.props;

    return (
      <div className="player">
        <div className="player__section player__section--left">
          <button onClick={this.handleButton}>
            <p className="player__icon">{playing ? '❚❚' : '►'}</p>
            <p>{formatTime(current)} / {formatTime(duration)}</p>
          </button>
        </div>
        <div className="player__section player__section--middle">
          <div className="progress" onClick={this.handleScrub} ref={(p) => this.progress = p}>
            <div className="progress__time" style={{ width: `${progress}%` }} />
          </div>
          <h3 className="player__title">Playing: {show.displayNumber}: {show.title}</h3>
        </div>
        <div className="player__section player__section--right">
          <button onClick={this.handleSpeed} className="player__speed">
            <p>FASTNESS</p>
            <span className="player__speeddisplay">{this.state.fastness} &times;</span>
          </button>
          <div className="player__volume">
            <p>LOUDNESS</p>
            <div className="player__inputs">
              <input name="volume" onChange={this.handleVolume} type="radio" value="0.1" id="vol10" />
              <label htmlFor="vol10">Volume Level 10/100</label>
              <input name="volume" onChange={this.handleVolume} type="radio" value="0.2" id="vol20" />
              <label htmlFor="vol20">Volume Level 20/100</label>
              <input name="volume" onChange={this.handleVolume} type="radio" value="0.3" id="vol30" />
              <label htmlFor="vol30">Volume Level 30/100</label>
              <input name="volume" onChange={this.handleVolume} type="radio" value="0.4" id="vol40" />
              <label htmlFor="vol40">Volume Level 40/100</label>
              <input name="volume" onChange={this.handleVolume} type="radio" value="0.5" id="vol50" />
              <label htmlFor="vol50">Volume Level 50/100</label>
              <input name="volume" onChange={this.handleVolume} type="radio" value="0.6" id="vol60" />
              <label htmlFor="vol60">Volume Level 60/100</label>
              <input name="volume" onChange={this.handleVolume} type="radio" value="0.7" id="vol70" />
              <label htmlFor="vol70">Volume Level 70/100</label>
              <input name="volume" onChange={this.handleVolume} type="radio" value="0.8" id="vol80" />
              <label htmlFor="vol80">Volume Level 80/100</label>
              <input defaultChecked name="volume" onChange={this.handleVolume} type="radio" value="0.9" id="vol90" />
              <label htmlFor="vol90">Volume Level 90/100</label>
              <input name="volume" onChange={this.handleVolume} type="radio" value="1" id="vol100" />
              <label htmlFor="vol100">Volume Level 100/100</label>
            </div>
          </div>
        </div>
        <audio
          onLoadedMetadata={this.handleUpdate}
          onPause={this.handlePlayback}
          onPlay={this.handlePlayback}
          onTimeUpdate={this.handleUpdate}
          ref={(a) => this.audio = a}
          src={show.url}
        />
      </div>
    );
  };
}
