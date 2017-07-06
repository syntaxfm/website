import React from 'react';

import Show from './Show';

export default ({ playing, selected, setPlaying, shows }) => (
  <div className="showList">
    {shows.map((show) => (
      <Show
        key={show.number}
        playing={playing}
        selected={selected}
        setPlaying={setPlaying}
        show={show}
      />
    ))}
    <div className="show show--dummy" />
  </div>
);
