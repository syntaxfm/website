import React from 'react';
import PropTypes from 'prop-types';
import { Configure,   InstantSearch,   SearchBox, InfiniteHits, PoweredBy } from 'react-instantsearch-dom';
import Show from '../components/Show';
import ShowNotes from '../components/ShowNotes';

const ShowList = ({ show, currentPlaying, currentShow, setCurrentPlaying }) => {
  return (
    <InstantSearch
      appId="0BJH6ZHANS"
      apiKey="6b603f518f8226fe184df623bba4dce1"
      indexName="SYNTAX_FM"
    >
      <Configure hitsPerPage={25} />
      <div className="ais-search">
        <SearchBox translations={{ placeholder: 'Search for episodes...' }} />
        <PoweredBy />
      </div>
      <div className="ais-instantSearch">
        <InfiniteHits
          hitComponent={hit => (
            <Show
              show={hit}
              currentPlaying={currentPlaying}
              currentShow={currentShow}
              setCurrentPlaying={setCurrentPlaying}
            />
          )}
        />
        <ShowNotes show={show} setCurrentPlaying={setCurrentPlaying} />
      </div>
    </InstantSearch>
  );
};

ShowList.propTypes = {
  show: PropTypes.any.isRequired,
  currentPlaying: PropTypes.string.isRequired,
  currentShow: PropTypes.string.isRequired,
  setCurrentPlaying: PropTypes.func.isRequired,
};

export default ShowList;
