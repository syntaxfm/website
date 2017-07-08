import React from 'react';

import Show from './Show';

export default ({ ...props, shows }) => (
  <div className="showList">
    {shows.map((show) => (
      <Show
        {...props}
        key={show.number}
        show={show}
      />
    ))}
    <div className="show show--dummy" />
  </div>
);
