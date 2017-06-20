import React from 'react'
import Show from './Show';

const yolo = (__html) => ({ __html })

export default ({ show }) =>
  <div className="showNotes">
    <div dangerouslySetInnerHTML={yolo(show.html)}></div>
  </div>
