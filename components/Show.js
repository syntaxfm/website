import React from 'react';
import PropTypes from 'prop-types';
import slug from 'speakingurl';
import Router from 'next/router';
import { FaPlay } from 'react-icons/fa';
import Bars from './bars';

export default class Show extends React.Component {
  static propTypes = {
    show: PropTypes.object.isRequired,
    currentPlaying: PropTypes.string.isRequired,
    currentShow: PropTypes.string.isRequired,
    setCurrentPlaying: PropTypes.func.isRequired,
    isPlaying: PropTypes.bool
  };

  changeURL = (e, show) => {
    e.preventDefault();
    const { href } = e.currentTarget;
    Router.push(`/?number=${show.displayNumber}`, href, { shallow: true });
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
