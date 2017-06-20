import React from 'react'
import Show from './Show';

export default ({ show }) =>
  <div className="player">
    <hr/>
    <h3>Currently Playing: {show.title}</h3>
    <audio controls src={show.url}></audio>
    <hr/>
  </div>
