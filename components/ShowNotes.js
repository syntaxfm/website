import React from 'react'
import Show from './Show';

const yolo = (__html) => ({ __html })

export default ({ show, setCurrentPlaying }) =>
  <div className="showNotes">
    <p>{show.date}</p>
    <button onClick={() => setCurrentPlaying(show.displayNumber)}>Play Episode {show.displayNumber}</button>
    <button>Download</button>
    <button>Edit Show Notes</button>
    <div dangerouslySetInnerHTML={{ __html: show.html }}></div>
  </div>
