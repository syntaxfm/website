import React from 'react'
import Show from './Show';

const yolo = (__html) => ({ __html })

export default ({ show, setCurrentPlaying }) =>
  <div className="showNotes">
    <button onClick={() => setCurrentPlaying(show.displayNumber)}>Play Episode {show.displayNumber}</button>
    <div dangerouslySetInnerHTML={{ __html: show.html }}></div>
  </div>
