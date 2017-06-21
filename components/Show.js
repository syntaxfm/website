import React from 'react'
import Link from 'next/link';
import slug from 'speakingurl';
import Router from 'next/router'

export default class Show extends React.Component {
  changeURL = (e, show) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    Router.push(`/?number=${show.displayNumber}`, href, { shallow: true })
  }

  render() {
    const { show, currentPlaying, currentShow } = this.props;
    return (
      <div className={`show
        ${currentPlaying === show.displayNumber ? 'show--playing' : null }
        ${currentShow === show.displayNumber ? 'show--active' : null }
      `}>
        <a className="show__link" href={`/show/${show.displayNumber}/${slug(show.title)}`} onClick={(e) => this.changeURL(e, show)}>
          <p className="show__displayNumber">Episode {show.displayNumber}</p>
          <h3 className="show__title">{show.title}</h3>
        </a>
      </div>
    )
  }
}
