import React from 'react'
import Show from './Show';

export default ({ shows, currentPlaying, currentShow, setCurrentPlaying }) =>
  <div className="showList">
    {shows.map(show => <Show setCurrentPlaying={setCurrentPlaying} currentPlaying={currentPlaying} currentShow={currentShow} key={show.number} show={show} />)}
    <div className="show show--dummy"/>
  </div>
