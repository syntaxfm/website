import React from 'react';
import slug from 'speakingurl';
import { FaPlay } from 'react-icons/fa';
import Bars from './bars';

interface ShowProps {
  show: ShowPayload;
  currentPlaying: string;
  currentShow: string
  setCurrentPlaying: Function;
  isPlaying: Boolean;
}

interface ShowPayload {
  title: string;
  displayNumber: string;
  displayDate; string;
}

export default class Show extends React.Component<ShowProps> {
  
  constructor(props) {
    super(props);
  }

  changeURL = (e, show) => {
    e.preventDefault();
    let url = '/show/' + e.currentTarget.href.split('/show/')[1] 
    history.pushState(null, null, url) 
    window.dispatchEvent(new Event('popstate'))
  };

  render() {
    const { show, currentPlaying, currentShow, setCurrentPlaying, isPlaying } = this.props;
    return (
      <div
        className={`show ${
          currentPlaying === show.displayNumber ? 'show--playing' : ''
          } ${currentShow === show.displayNumber ? 'show--active' : ''}
      `}
      >
        <a
          className="show__link"
          href={`/show/${show.displayNumber}/${slug(show.title)}`}
          onClick={e => this.changeURL(e, show)}
        > 
          <div className="show__container">
            <p className="show__displayNumber">Episode {show.displayNumber}</p>
            <span className="show__seperator">{" | "}</span>
            <p className="show__modifiedDate">{show.displayDate}</p>
          </div>
          <h3 className="show__title">{show.title}</h3>
        </a>

        <div className="show__playcontrols">
          {currentPlaying === show.displayNumber ? (
            <Bars isPlaying={isPlaying} />
          ) : (
              <button
                type="button"
                onClick={() => setCurrentPlaying(show.displayNumber)}
                className="show__play"
                title="play button"
              >
                <FaPlay />
              </button>
            )}
        </div>
      </div>
    );
  }
}
