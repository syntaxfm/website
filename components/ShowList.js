import React from 'react';
import PropTypes from 'prop-types';
import getConfig from 'next/config'
import { Configure,   InstantSearch,   SearchBox, InfiniteHits, PoweredBy } from 'react-instantsearch-dom';
import { FaMicrophone } from "react-icons/fa";
import Show from '../components/Show';
import ShowNotes from '../components/ShowNotes';

const ShowList = ({ show, currentPlaying, currentShow, setCurrentPlaying }) => {
  const { ALGOLIA_APP_ID, ALGOLIA_API_KEY, ALGOLIA_INDEX_NAME } = getConfig().publicRuntimeConfig;

  const handleSpeech = event => {
    event.preventDefault();

    window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if ('SpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();

      recognition.interimResults = true;

      recognition.onresult = e => {
        let query = e.results[0][0].transcript;
        this.search.refine(query)
      }

      if (event.target.classList.contains('ais-microphone-on')) {
        event.target.classList.remove('ais-microphone-on');
        recognition.stop();
      } else {
        event.target.classList.add('ais-microphone-on');
        recognition.start();
      }
    } else {
      console.log("Speech recognition Chrome API not supported");
    }
  }

  return (
    <InstantSearch
      appId={ALGOLIA_APP_ID}
      apiKey={ALGOLIA_API_KEY}
      indexName={ALGOLIA_INDEX_NAME}
    >
      <Configure hitsPerPage={25} />
      <div className="ais-search">
        <SearchBox translations={{ placeholder: 'Search for episodes...' }} ref={node => this.search = node} />
        <PoweredBy />
        <button className="ais-microphone" onClick={handleSpeech}>
          <FaMicrophone />
        </button>
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
