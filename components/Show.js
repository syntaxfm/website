import Link from 'next/link';
import { Component } from 'react';
import Router from 'next/router';
import slug from 'speakingurl';

import Bars from './Bars';
import classes from '../lib/classes';

class Show extends Component {
  handleChange = (e) => {
    e.preventDefault();

    const { href } = e.currentTarget;
    const { show } = this.props;

    Router.push(`/?number=${show.displayNumber}`, href, { shallow: true });
  };

  handleClick = () => {
    const { setPlaying, show } = this.props;
    setPlaying(show.displayNumber);
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
            <button className="show__play" onClick={this.handleClick}>►</button>
          )}
        </div>
      </div>
    );
  }
};

export default Show;
