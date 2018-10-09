import React from 'react'
import Show from './Show';
import { Context } from './Provider'

export default ({ show, setCurrentPlaying }) =>
  <div className="showNotes">
    <p className="show__date">{show.displayDate}</p>
    <h2>{show.title}</h2>
    <Context.Consumer>
      {(context) => (
        <button className="button" onClick={() => context.backToShowClicked(context.state.topOfShow)}>
          <span className="icon">👈</span> Back to Episode {show.displayNumber}
        </button>
      )}
    </Context.Consumer>
    <button className="button" onClick={() => setCurrentPlaying(show.displayNumber)}><span className="icon">🎵</span> Play Episode {show.displayNumber}</button>
    <a className="button" download href={show.url}><span className="icon">👇</span> Download Show</a>
    <a className="button" href={`https://github.com/wesbos/Syntax/edit/master/${show.notesFile}`} target='_blank'><span className="icon">✏️</span> Edit Show Notes</a>
    <div dangerouslySetInnerHTML={{ __html: show.html }}></div>
  </div>

