import React from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaPause } from 'react-icons/fa';
import formatTime from '../lib/formatTime';

// TODO Fix all eslint issues

export default class Player extends React.Component {
  static propTypes = {
    show: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    let lastPlayed = 0;
    let lastVolumePref = 0;

    // for SSR
    // if (typeof window !== 'undefined') {
    //   const { show } = this.props;
    //   const lp = localStorage.getItem(`lastPlayed${show.number}`);

    //   // eslint-disable-next-line
    //   if (lp) lastPlayed = JSON.parse(lp).lastPlayed;
    // }

    // for Server Side Rendering
    if (typeof window !== 'undefined') {
      const { show } = this.props;
      const lp = localStorage.getItem(`lastPlayed${show.number}`);
      const lastVolume = localStorage.getItem(
        `lastVolumeSetting${show.number}`
      );

      // eslint-disable-next-line
      if (lp) lastPlayed = JSON.parse(lp).lastPlayed;
      if (lastVolume) lastVolumePref = JSON.parse(lastVolume).lastVolumePref;
    }

    this.state = {
      progressTime: 50,
      playing: false,
      duration: 0,
      currentTime: lastPlayed,
      currentVolume: lastVolumePref,
      checked: false,
      playbackRate: 1,
      timeWasLoaded: lastPlayed !== 0,
      showTooltip: false,
      tooltipPosition: 0,
      tooltipTime: '0:00'
    };
  }

  componentWillUpdate(nextProps, nextState) {
    this.audio.playbackRate = nextState.playbackRate;
  }

  // componentDidUpdate(prevProps, prevState) {
  //   const { show } = this.props;
  //   const { currentTime, currentVolume } = this.state;
  //   if (show.number !== prevProps.show.number) {
  //     const lp = localStorage.getItem(`lastPlayed${show.number}`);
  //     // const lastVolume = localStorage.getItem(
  //     //   `lastVolumeSetting${show.number}`
  //     // );
  //     if (lp) {
  //       const data = JSON.parse(lp);
  //       // const data2 = JSON.parse(lastVolume);
  //       // eslint-disable-next-line

  //       this.setState({
  //         currentTime: data.lastPlayed,
  //         currentVolume: data2.currentVolume
  //       });
  //       this.audio.currentTime = data.lastPlayed;
  //       // this.audio.volume = data2.currentVolume;
  //     }
  //     this.audio.play();
  //   } else {
  //     localStorage.setItem(
  //       `lastPlayed${show.number}`,
  //       JSON.stringify({ lastPlayed: currentTime })
  //     );
  //     // localStorage.setItem(
  //     //   `lastVolumeSetting${show.number}`,
  //     //   JSON.stringify({ currentVolume: currentVolume })
  //     // );
  //   }
  // }

  componentDidUpdate(prevProps, prevState) {
    const { show } = this.props;
    const { currentTime, currentVolume } = this.state;
    if (show.number !== prevProps.show.number) {
      const lp = localStorage.getItem(`lastPlayed${show.number}`);
      // const lastVolume = localStorage.getItem(
      //   `lastVolumeSetting${show.number}`
      // );
      if (lp) {
        const data = JSON.parse(lp);
        const data2 = JSON.parse(lastVolume);
        // eslint-disable-next-line

        this.setState({
          currentTime: data.lastPlayed,
          currentVolume: data2.lastVolumePref
        });
        this.audio.currentTime = data.lastPlayed;
        this.audio.volume = data2.lastVolumePref;
      }
      this.audio.play();
    } else {
      localStorage.setItem(
        `lastPlayed${show.number}`,
        JSON.stringify({ lastPlayed: currentTime })
      );
      localStorage.setItem(
        `lastVolumeSetting${show.number}`,
        JSON.stringify({ lastVolumePref: currentVolume })
      );
    }
  }

  // timeUpdate = e => {
  //   console.log('Updating Time');
  //   const { show } = this.props;
  //   const { timeWasLoaded } = this.state;
  //   console.log(`🌈 ${timeWasLoaded}`);
  //   // Check if the user already had a curent time
  //   if (timeWasLoaded) {
  //     const lp = localStorage.getItem(`lastPlayed${show.number}`);
  //     const lastVolume = localStorage.getItem(
  //       `lastVolumeSetting${show.number}`
  //     );
  //     if (lp) {
  //       console.log(`💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎 ${lp}`);
  //       console.log(`🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖 ${lastVolume}`);
  //       e.currentTarget.currentTime = JSON.parse(lp).lastPlayed;
  //       e.currentTarget.volume = JSON.parse(lastVolume).currentVolume;
  //     }
  //     this.setState({ timeWasLoaded: false });
  //   } else {
  //     const { currentTime = 0, duration = 0 } = e.currentTarget;

  //     const progressTime = (currentTime / duration) * 100;
  //     if (Number.isNaN(progressTime)) return;
  //     this.setState({ progressTime, currentTime, duration });
  //   }
  // };
  timeUpdate = e => {
    console.log('Updating Time');
    const { show } = this.props;
    const { timeWasLoaded } = this.state;
    console.log(`🌈 ${timeWasLoaded}`);
    // Check if the user already had a curent time
    if (timeWasLoaded) {
      const lp = localStorage.getItem(`lastPlayed${show.number}`);

      if (lp) {
        console.log(`💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎 ${lp}`);
        e.currentTarget.currentTime = JSON.parse(lp).lastPlayed;
      }
      this.setState({ timeWasLoaded: false });
    } else {
      const { currentTime = 0, duration = 0 } = e.currentTarget;

      const progressTime = (currentTime / duration) * 100;
      if (Number.isNaN(progressTime)) return;
      this.setState({ progressTime, currentTime, duration });
    }
  };

  volumeUpdate = e => {
    console.log('Updating Volume');
    const { show } = this.props;
    const { timeWasLoaded } = this.state;
    console.log(`🌈🌈 ${timeWasLoaded}`);
    // Check if the user already had a curent volume
    if (timeWasLoaded) {
      // const lp = localStorage.getItem(`lastPlayed${show.number}`);
      const lastVolume = localStorage.getItem(
        `lastVolumeSetting${show.number}`
      );
      if (lastVolume) {
        console.log(`🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖 ${lastVolume}`);
        e.currentTarget.volume = JSON.parse(lastVolume).lastVolumePref;
      }
      this.setState({ timeWasLoaded: false });
    }
  };

  groupUpdates = e => {
    this.timeUpdate(e);
    this.volumeUpdate(e);
  };
  togglePlay = () => {
    const { playing } = this.state;
    const method = playing ? 'pause' : 'play';
    this.audio[method]();
  };

  scrubTime = eventData =>
    (eventData.nativeEvent.offsetX / this.progress.offsetWidth) *
    this.audio.duration;

  scrub = e => {
    this.audio.currentTime = this.scrubTime(e);
  };

  seekTime = e => {
    this.setState({
      tooltipPosition: e.nativeEvent.offsetX,
      tooltipTime: formatTime(this.scrubTime(e))
    });
  };

  playPause = () => {
    this.setState({ playing: !this.audio.paused });
    const method = this.audio.paused ? 'add' : 'remove';
    document.querySelector('.bars').classList[method]('bars--paused'); // 💩
  };

  volume = e => {
    this.audio.volume = e.currentTarget.value;
    this.setState({
      currentVolume: `${e.currentTarget.value}`,
      checked: !this.state.checked
    });
  };

  speedUp = () => {
    this.speed(0.25);
  };

  speedDown = e => {
    e.preventDefault();
    this.speed(-0.25);
  };

  speed = change => {
    const playbackRateMax = 2.5;
    const playbackRateMin = 0.75;
    // eslint-disable-next-line
    let playbackRate = this.state.playbackRate + change;

    if (playbackRate > playbackRateMax) {
      playbackRate = playbackRateMin;
    }

    if (playbackRate < playbackRateMin) {
      playbackRate = playbackRateMax;
    }

    this.setState({ playbackRate });
  };

  render() {
    const { show } = this.props;
    const {
      playing,
      playbackRate,
      progressTime,
      currentTime,
      checked,
      duration,
      showTooltip,
      tooltipPosition,
      tooltipTime
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
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </button>
        </div>

        <div className="player__section player__section--middle">
          {/* eslint-disable */}
          <div
            className="progress"
            onClick={this.scrub}
            onMouseMove={this.seekTime}
            onMouseEnter={() => {
              this.setState({ showTooltip: true });
            }}
            onMouseLeave={() => {
              this.setState({ showTooltip: false });
            }}
            ref={x => (this.progress = x)}
          >
            {/* eslint-enable */}
            <div
              className="progress__time"
              style={{ width: `${progressTime}%` }}
            />
          </div>
          <h3 className="player__title">
            Playing: {show.displayNumber}: {show.title}
          </h3>
          <div
            className="player__tooltip"
            style={{
              left: `${tooltipPosition}px`,
              opacity: `${showTooltip ? '1' : '0'}`
            }}
          >
            {tooltipTime}
          </div>
        </div>

        <div className="player__section player__section--right">
          <button
            onClick={this.speedUp}
            onContextMenu={this.speedDown}
            className="player__speed"
            type="button"
          >
            <p>FASTNESS</p>
            <span className="player__speeddisplay">{playbackRate} &times;</span>
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
                checked={this.checked}
              />
              <label htmlFor="vol10">
                {/* eslint-disable-line */}
                <span className="sr-only">Volume Level 10/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.2"
                id="vol20"
                className="sr-only"
                checked={this.checked}
              />
              <label htmlFor="vol20">
                {/* eslint-disable-line */}
                <span className="sr-only">Volume Level 20/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.3"
                id="vol30"
                className="sr-only"
                checked={this.checked}
              />
              <label htmlFor="vol30">
                {/* eslint-disable-line */}
                <span className="sr-only">Volume Level 30/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.4"
                id="vol40"
                className="sr-only"
                checked={this.checked}
              />
              <label htmlFor="vol40">
                {/* eslint-disable-line */}
                <span className="sr-only">Volume Level 40/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.5"
                id="vol50"
                className="sr-only"
                checked={this.checked}
              />
              <label htmlFor="vol50">
                {/* eslint-disable-line */}
                <span className="sr-only">Volume Level 50/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.6"
                id="vol60"
                className="sr-only"
                checked={this.checked}
              />
              <label htmlFor="vol60">
                {/* eslint-disable-line */}
                <span className="sr-only">Volume Level 60/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.7"
                id="vol70"
                className="sr-only"
                checked={this.checked}
              />
              <label htmlFor="vol70">
                {/* eslint-disable-line */}
                <span className="sr-only">Volume Level 70/100</span>
              </label>
              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.8"
                id="vol80"
                className="sr-only"
                checked={this.checked}
              />
              <label htmlFor="vol80">
                {/* eslint-disable-line */}
                <span className="sr-only">Volume Level 80/100</span>
              </label>

              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="0.9"
                id="vol90"
                className="sr-only"
                checked={this.checked}
              />
              <label htmlFor="vol90">
                {/* eslint-disable-line */}
                <span className="sr-only">Volume Level 90/100</span>
              </label>

              <input
                onChange={this.volume}
                type="radio"
                name="volume"
                value="1"
                id="vol100"
                className="sr-only"
                checked={this.checked}
              />
              <label htmlFor="vol100">
                <span className="sr-only">Volume Level 100/100</span>
              </label>
            </div>
          </div>
        </div>
        {/* eslint-disable */}
        <audio
          ref={audio => (this.audio = audio)}
          onPlay={this.playPause}
          onPause={this.playPause}
          onTimeUpdate={this.timeUpdate}
          onVolumeChange={this.volumeUpdate}
          onLoadedMetadata={this.groupUpdates}
          src={show.url}
        />
        {/* eslint-enable */}
      </div>
    );
  }
}
