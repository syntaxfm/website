import React from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaPause } from 'react-icons/fa';
import formatTime from '../lib/formatTime';

export default class Player extends React.Component {
  constructor(props) {
    super(props);

    let lastPlayed = 0;

    // for SSR
    if (typeof window !== 'undefined') {
      const { show } = this.props;
      const lp = localStorage.getItem(`lastPlayed${show.number}`);
      if (lp) {
        // eslint-disable-next-line prefer-destructuring
        lastPlayed = JSON.parse(lp).lastPlayed;
      }
    }

    this.state = {
      progressTime: 50,
      playing: false,
      duration: 0,
      currentTime: lastPlayed,
      playbackRate: 1,
      timeWasLoaded: lastPlayed !== 0,
    };

    this.timeUpdate = this.timeUpdate.bind(this);
    this.togglePlay = this.togglePlay.bind(this);
    this.scrub = this.scrub.bind(this);
    this.playPause = this.playPause.bind(this);
    this.volume = this.volume.bind(this);
    this.speed = this.speed.bind(this);
  }

  componentWillUpdate(nextProps, nextState) {
    this.audio.playbackRate = nextState.playbackRate;
  }

  componentDidUpdate(prevProps) {
    const { show } = this.props;
    const { currentTime } = this.state;

    if (show.number !== prevProps.show.number) {
      const lp = localStorage.getItem(`lastPlayed${show.number}`);
      if (lp) {
        const data = JSON.parse(lp);
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({
          currentTime: data.lastPlayed,
        });
        this.audio.currentTime = data.lastPlayed;
      }
      this.audio.play();
    } else {
      localStorage.setItem(
        `lastPlayed${show.number}`,
        JSON.stringify({ lastPlayed: currentTime }),
      );
    }
  }

  timeUpdate(e) {
    const { timeWasLoaded } = this.state;
    const { show } = this.props;

    console.log('Updating Time');
    // Check if the user already had a curent time
    if (timeWasLoaded) {
      const lp = localStorage.getItem(`lastPlayed${show.number}`);
      if (lp) {
        e.currentTarget.currentTime = JSON.parse(lp).lastPlayed;
      }
      this.setState({ timeWasLoaded: false });
    } else {
      const { currentTime = 0, duration = 0 } = e.currentTarget;

      const progressTime = (currentTime / duration) * 100;
      if (Number.isNaN(progressTime)) return;
      this.setState({ progressTime, currentTime, duration });
    }
  }

  togglePlay() {
    const { playing } = this.state;
    const method = playing ? 'pause' : 'play';
    this.audio[method]();
  }

  scrub(e) {
    const scrubTime = (e.nativeEvent.offsetX / this.progress.offsetWidth) * this.audio.duration;
    this.audio.currentTime = scrubTime;
  }

  playPause() {
    this.setState({ playing: !this.audio.paused });
    const method = this.audio.paused ? 'add' : 'remove';
    document.querySelector('.bars').classList[method]('bars--paused'); // 💩
  }

  volume(e) {
    this.audio.volume = e.currentTarget.value;
  }

  speed() {
    const { playbackRate: playback } = this.state;
    let playbackRate = playback + 0.25;
    if (playbackRate > 2.5) {
      playbackRate = 0.75;
    }
    this.setState({ playbackRate });
  }

  render() {
    const { show } = this.props;
    const {
      playing, progressTime, currentTime, duration, playbackRate,
    } = this.state;

    return (
      <div className="player">
        <div className="player__section player__section--left">
          <button
            onClick={this.togglePlay}
            aria-label={playing ? 'pause' : 'play'}
            type="button"
          >
            <p className="player__icon">{playing ? <FaPause /> : <FaPlay />}</p>
            <p>
              {formatTime(currentTime)}
              {' '}
              /
              {' '}
              {formatTime(duration)}
            </p>
          </button>
        </div>
        <div className="player__section player__section--middle">
          <div
            className="progress"
            onClick={this.scrub}
            ref={(x) => {
              this.progress = x;
            }}
          >
            <div
              className="progress__time"
              style={{ width: `${progressTime}%` }}
            />
          </div>
          <h3 className="player__title">
            Playing:
            {' '}
            {show.displayNumber}
            :
            {' '}
            {show.title}
          </h3>
        </div>
        <div className="player__section player__section--right">
          <button onClick={this.speed} className="player__speed" type="button">
            <p>FASTNESS</p>
            <span className="player__speeddisplay">
              {playbackRate}
              {' '}
              &times;
              {' '}
            </span>
          </button>
          <div className="player__volume">
            <p>LOUDNESS</p>
            <div className="player__inputs">
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.1"
                id="vol10"
                className="sr-only"
              />
              <label htmlFor="vol10">
                <span className="sr-only">Volume Level 10/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.2"
                id="vol20"
                className="sr-only"
              />
              <label htmlFor="vol20">
                <span className="sr-only">Volume Level 20/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.3"
                id="vol30"
                className="sr-only"
              />
              <label htmlFor="vol30">
                <span className="sr-only">Volume Level 30/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.4"
                id="vol40"
                className="sr-only"
              />
              <label htmlFor="vol40">
                <span className="sr-only">Volume Level 40/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.5"
                id="vol50"
                className="sr-only"
              />
              <label htmlFor="vol50">
                <span className="sr-only">Volume Level 50/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.6"
                id="vol60"
                className="sr-only"
              />
              <label htmlFor="vol60">
                <span className="sr-only">Volume Level 60/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.7"
                id="vol70"
                className="sr-only"
              />
              <label htmlFor="vol70">
                <span className="sr-only">Volume Level 70/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.8"
                id="vol80"
                className="sr-only"
              />
              <label htmlFor="vol80">
                <span className="sr-only">Volume Level 80/100</span>
              </label>
              <input
                onChange={this.volume}
                defaultChecked
                type="radio"
                name="volume"
                value="0.9"
                id="vol90"
                className="sr-only"
              />
              <label htmlFor="vol90">
                <span className="sr-only">Volume Level 90/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="1"
                id="vol100"
                className="sr-only"
              />
              <label htmlFor="vol100">
                <span className="sr-only">Volume Level 100/100</span>
              </label>
            </div>
          </div>
        </div>
        <audio
          ref={(audio) => {
            this.audio = audio;
          }}
          onPlay={this.playPause}
          onPause={this.playPause}
          onTimeUpdate={this.timeUpdate}
          onLoadedMetadata={this.timeUpdate}
          src={show.url}
        />
      </div>
    );
  }
}

Player.propTypes = {
  show: PropTypes.shape({
    url: PropTypes.string,
    displayNumber: PropTypes.string,
    title: PropTypes.string,
  }),
};

Player.defaultProps = {
  show: {},
};
