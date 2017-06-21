import React from 'react'
import Link from 'next/link';
import slug from 'speakingurl';
import Router from 'next/router'
import Bars from './bars';

export default class Show extends React.Component {
  changeURL = (e, show) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    Router.push(`/?number=${show.displayNumber}`, href, { shallow: true })
  }

  render() {
    const { show, currentPlaying, currentShow, setCurrentPlaying } = this.props;
    return (
      <div className={`show ${currentPlaying === show.displayNumber ? 'show--playing' : '' } ${currentShow === show.displayNumber ? 'show--active' : '' }
      `}>
        <a className="show__link" href={`/show/${show.displayNumber}/${slug(show.title)}`} onClick={(e) => this.changeURL(e, show)}>
          <p className="show__displayNumber">Episode {show.displayNumber}</p>
          <h3 className="show__title">{show.title}</h3>
        </a>

        <div className="show__playcontrols">
          {currentPlaying === show.displayNumber ? <Bars/ > : <button onClick={() => setCurrentPlaying(show.displayNumber)} className="show__play">►</button> }
        </div>
      </div>
    )
  }
}
