import React from 'react'
import Show from './Show';

export default ({ shows, currentPlaying, currentShow, setCurrentPlaying, highlightSearch, query }) =>
  <div className="showList">
    {shows.map(show => <Show setCurrentPlaying={setCurrentPlaying} highlightSearch={highlightSearch} currentPlaying={currentPlaying} currentShow={currentShow} key={show.number} show={show} query={query} />)}
    <div className={shows.length ? "no-results hidden" : "no-results"}>
      <p>No matching shows found.</p>
    </div>
    <div className="show show--dummy"></div>
  </div>
