/* eslint-disable react/no-danger */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

function handleClick(e) {
  const { target } = e;
  if (target.matches(`a[href*='#t=']`)) {
    e.preventDefault();
    const { href } = target;
    const seconds = href
      .split('#t=')
      .at(-1)
      .split(':')
      .reverse()
      .map(Number)
      .map((num, i) => num * 60 ** i)
      .reduce((acc, num) => acc + num, 0);
    // TODO: This shouldn't use querySelector. It should use a ref. Meh its fine
    document.querySelector('audio').currentTime = seconds;
  }
}

const ShowNotes = ({ show, setCurrentPlaying }) => {
  useEffect(() => {
    document.querySelector('.showNotes').scrollTop = 0;
  });

  return (
    <div className="showNotes">
      <p className="show__date">{show.displayDate}</p>
      <h2>{show.title}</h2>
      <button
        className="button"
        onClick={() => {
          console.log('Playing', show.displayNumber);
          setCurrentPlaying(show.displayNumber);
          // Hack to play the current show. The Audio element needs to be put into context, so we can control it from the ShowNotes component.
          // https://github.com/wesbos/Syntax/issues/691
          document.querySelector('audio').play();
        }}
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
      <div
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: show.html }}
      />
    </div>
  );
};

ShowNotes.propTypes = {
  show: PropTypes.object.isRequired,
  setCurrentPlaying: PropTypes.func.isRequired,
};

export default ShowNotes;
