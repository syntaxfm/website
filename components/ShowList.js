import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Show from './Show';

const ShowList = ({
  shows,
  currentPlaying,
  currentShow,
  setCurrentPlaying,
  isPlaying,
}) => {
  const [showYears, setShowYears] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const years = new Set();
    shows.forEach((show) => {
      years.add(new Date(show.date).getFullYear());
    });
    setShowYears(years);
  }, [shows]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredShows = shows.filter((show) => {
    const showYear = new Date(show.date).getFullYear();
    const showTitle = show.title.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      (filter === 'all' || showYear === parseInt(filter, 10)) &&
      (searchTerm === '' || showTitle.includes(search))
    );
  });

  return (
    <div className="showList">
      <div className="filter__wrapper">
        <select
          defaultValue="all"
          className="filter__select"
          onChange={handleFilterChange}
        >
          <option value="all">All</option>
          {[...showYears].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="filter__input"
          placeholder="Search"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      {filteredShows.map((show) => (
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
