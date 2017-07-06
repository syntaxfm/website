import Link from 'next/link';
import React from 'react';
import Router from 'next/router';
import slug from 'speakingurl';

import Bars from './Bars';
import classes from '../lib/classes';

export default class Show extends React.Component {
  handleChange = (e) => {
    e.preventDefault();

    const href = e.currentTarget.href;
    const { show } = this.props;

    Router.push(`/?number=${show.displayNumber}`, href, { shallow: true });
  };

  setPlaying = () => {
    const { show } = this.props;
    this.props.setPlaying(show.displayNumber);
  };

  render = () => {
    const { playing, selected, show } = this.props;
    const list = {
      show: true,
      'show--active': selected === show.displayNumber,
      'show--playing': playing === show.displayNumber,
    };

    return (
      <div className={classes(list)}>
        <a
          className="show__link"
          href={`/show/${show.displayNumber}/${slug(show.title)}`}
          onClick={this.handleChange}
        >
          <p className="show__displayNumber">Episode {show.displayNumber}</p>
          <h3 className="show__title">{show.title}</h3>
        </a>
        <div className="show__playcontrols">
          {playing === show.displayNumber ? <Bars /> : (
            <button className="show__play" onClick={this.setPlaying}>►</button>
          )}
        </div>
      </div>
    );
  }
};
