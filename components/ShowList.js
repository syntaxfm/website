import React from 'react'
import Show from './Show';

export default ({ shows }) =>
  <div className="showList">
    {shows.map(show => <Show key={show.number} show={show} />)}
  </div>
