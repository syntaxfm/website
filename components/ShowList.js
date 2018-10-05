import React from 'react';
import PropTypes from 'prop-types';
import Show from './Show';

const ShowList = ({
  shows, currentPlaying, currentShow, setCurrentPlaying,
}) => (
  <div className="showList">
    {shows.map(show => (
      <Show
        setCurrentPlaying={setCurrentPlaying}
        currentPlaying={currentPlaying}
        currentShow={currentShow}
        key={show.number}
        show={show}
      />
    ))}
    <div className="show show--dummy" />
  </div>
);

export default ShowList;

ShowList.propTypes = {
  shows: PropTypes.arrayOf(PropTypes.object),
  currentPlaying: PropTypes.string,
  currentShow: PropTypes.string,
  setCurrentPlaying: PropTypes.func,
};

ShowList.defaultProps = {
  shows: [],
  currentPlaying: '',
  currentShow: '',
  setCurrentPlaying: () => {},
};
