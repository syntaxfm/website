import React, { Component } from 'react'
import Link from 'next/link';

export default class Logo extends Component {

  handleClick = (event) => {
    const rightClick = event.type === 'contextmenu' || event.button === 2 || event.nativeEvent.which === 3
    if (rightClick)
      console.log('Right Click detected...')
    else
      console.log('Left click detected...')
  }

  render() {
    return (
      <Link href="/">
        <a aria-label="Syntax.FM" onClick={this.handleClick} onContextMenu={this.handleClick}>
          <img className="header__logo" src="/static/logo.png" alt="Syntax" />
        </a>
      </Link>
    )
  }

}
