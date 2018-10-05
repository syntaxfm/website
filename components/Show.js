import React from 'react';
import PropTypes from 'prop-types';
import { FaPlay } from 'react-icons/fa';
import slug from 'speakingurl';
import Router from 'next/router';
import Bars from './bars';

export default class Show extends React.Component {
  static changeURL(e, show) {
    e.preventDefault();
    const { href } = e.currentTarget;
    Router.push(`/?number=${show.displayNumber}`, href, { shallow: true });
  }

  render() {
    const {
      show, currentPlaying, currentShow, setCurrentPlaying,
    } = this.props;

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
          <p className="show__displayNumber">
            Episode
            {' '}
            {show.displayNumber}
          </p>
          <h3 className="show__title">{show.title}</h3>
        </a>
        <div className="show__playcontrols">
          {currentPlaying === show.displayNumber ? (
            <Bars />
          ) : (
            <button
              onClick={() => setCurrentPlaying(show.displayNumber)}
              className="show__play"
              title="play button"
              type="button"
            >
              <FaPlay />
            </button>
          )}
        </div>
      </div>
    );
  }
}

Show.propTypes = {
  show: PropTypes.shape({
    url: PropTypes.string,
    displayNumber: PropTypes.string,
    title: PropTypes.string,
  }),
  currentPlaying: PropTypes.string,
  currentShow: PropTypes.string,
  setCurrentPlaying: PropTypes.func,
};

Show.defaultProps = {
  show: {},
  currentPlaying: '',
  currentShow: '',
  setCurrentPlaying: () => {},
};
