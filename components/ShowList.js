import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Show from './Show';

const ShowList = ({
  shows,
  currentPlaying,
  currentShow,
  setCurrentPlaying,
  isPlaying,
}) => {
  const [search, setSearch] = useState('');
  return (
    <div className="showList">
      <input
        className="searchbar"
        type="text"
        placeholder="🔎 Search"
        onChange={(e) => setSearch(e.target.value)}
      />

      {shows
        .filter((show) =>
          show.title.toLowerCase().includes(search.toLowerCase())
        )
        .map((show) => (
          <Show
            setCurrentPlaying={setCurrentPlaying}
            currentPlaying={currentPlaying}
            currentShow={currentShow}
            key={show.number}
            show={show}
            isPlaying={isPlaying}
          />
        ))}
      <div className="show show--dummy" />
    </div>
  );
};

ShowList.propTypes = {
  shows: PropTypes.array.isRequired,
  currentPlaying: PropTypes.string.isRequired,
  currentShow: PropTypes.string.isRequired,
  setCurrentPlaying: PropTypes.func.isRequired,
  isPlaying: PropTypes.bool.isRequired,
};

export default ShowList;
