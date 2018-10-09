import React from 'react'
import Show from './Show';
import { Button, BtnA } from '../styles';

export default ({ show, setCurrentPlaying }) =>
  <div className="showNotes">
    <p className="show__date">{show.displayDate}</p>
    <h2>{show.title}</h2>
    <Button onClick={() => setCurrentPlaying(show.displayNumber)}><span className="icon">🎵</span> Play Episode {show.displayNumber}</Button>
    <BtnA className="button" download href={show.url}><span className="icon">👇</span> Download Show</BtnA>
    <BtnA className="button" href={`https://github.com/wesbos/Syntax/edit/master/${show.notesFile}`} target='_blank'><span className="icon">✏️</span> Edit Show Notes</BtnA>
    <div dangerouslySetInnerHTML={{ __html: show.html }}></div>
  </div>
