/* eslint-disable react/no-danger */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const ShowNotes = ({ show, setCurrentPlaying }) => {
  useEffect(() => {
    document.querySelector('.showNotes').scrollTop = 0;
  });

  return (
    <div
      className="showNotes"
      tabIndex="-1"
      aria-label={`Show Notes for ${show.title}`}
    >
      <p className="show__date">{show.displayDate}</p>
      <h2>{show.title}</h2>
      <button
        className="button"
        onClick={() => setCurrentPlaying(show.displayNumber)}
        type="button"
      >
        <span className="icon">🎵</span> Play Episode {show.displayNumber}
      </button>
      <a className="button" download href={show.url}>
        <span className="icon">👇</span> Download Show
      </a>
      <a
        className="button"
        href={`https://github.com/wesbos/Syntax/edit/master/shows/${show.notesFile}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="icon">✏️</span> Edit Show Notes
      </a>
      <div dangerouslySetInnerHTML={{ __html: show.html }} />
    </div>
  );
};

ShowNotes.propTypes = {
  show: PropTypes.object.isRequired,
  setCurrentPlaying: PropTypes.func.isRequired,
};

export default ShowNotes;
