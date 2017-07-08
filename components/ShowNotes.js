import React, { Component } from 'react';

import Show from './Show';

export default class ShowNotes extends Component {
  setPlaying = () => {
    const { setPlaying, show } = this.props;
    setPlaying(show.displayNumber);
  };

  render = () => {
    const { show } = this.props;

    return (
      <div className="showNotes">
        <p className="show__date">{show.displayDate}</p>
        <h2>{show.title}</h2>
        <button className="button" onClick={this.setPlaying}>
          <span className="icon">🎵</span> Play Episode {show.displayNumber}
        </button>
        <a className="button" download href={show.url}>
          <span className="icon">👇</span> Download Show
        </a>
        <a
          className="button"
          href={`https://github.com/wesbos/Syntax/edit/master/${show.notesFile}`}
          target="_blank"
        >
          <span className="icon">✏️</span> Edit Show Notes
        </a>
        <h2 id="show-notes">Show Notes</h2>
        <div dangerouslySetInnerHTML={{ __html: show.html }}></div>
      </div>
    );
  };
}
