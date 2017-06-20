import React from 'react'
import Link from 'next/link';
import slug from 'speakingurl';
import Router from 'next/router'

export default class Show extends React.Component {
  changeURL = (e, show) => {
    console.log('routing!');
    e.preventDefault();
    const href = e.currentTarget.href;
    console.log(show);
    Router.push(`/?number=${show.displayNumber}`, href, { shallow: true })
  }

  render() {
    const { show } = this.props;
    return (
      <div className="show">
          <a href={`/show/${show.displayNumber}/${slug(show.title)}`} onClick={(e) => this.changeURL(e, show)}>
            <h3>{show.title}</h3>
          </a>
        <span className="show__displayNumber">{show.displayNumber}</span>
      </div>
    )
  }
}
