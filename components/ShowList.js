import React from "react";
import PropTypes from "prop-types";
import Show from "./Show";

class ShowList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentStart: 0,
      currentEnd: 10,
      pageSize: 10,
      numOfShows: 0
    };
  }

  render() {
    const {
      shows,
      setCurrentPlaying,
      currentPlaying,
      currentShow
    } = this.props;

    return (
      <div className="showList">
        <div className="paginationControls">
          <span id="pgDwnSpan" className="pageUpDown" onClick={this.pageDown}>
            &lt;&lt; Previous{" "}
          </span>
          <input
            type="number"
            name="pageSize"
            min="1"
            max="25"
            step="1"
            value={this.state.pageSize}
            onChange={this.pageSizeChanged}
          ></input>
          <span id="nextSpan" className="pageUpDown" onClick={this.pageUp}>
            {" "}
            Next &gt;&gt;
          </span>
        </div>
        {this.getShortList(shows).map(show => (
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
  }

  pageSizeChanged = event => {
    let newVal = parseInt(event.target.value);
    //limit the values on how many files we page by...
    if (newVal > 25) {
      newVal = 25;
    }
    if (newVal < 1) {
      newVal = 1; //be reasonable now...
    }
    this.setState(state => {
      const { currentStart } = state;
      const newEnd = currentStart + newVal;
      return { pageSize: newVal, currentEnd: newEnd };
    });
  };

  getShortList = shows => {
    if (shows.length !== this.state.numOfShows) {
      this.setState({ numOfShows: shows.length });
    }
    return shows.slice(this.state.currentStart, this.state.currentEnd);
  };

  pageDown = () => {
    const state = this.state;
    this.setState(state => {
      const { currentStart, pageSize } = state;
      if (newStart !== 0) {
        let newEnd = currentStart - 1;
        let newStart = newEnd - pageSize > 0 ? newEnd - pageSize : 0;

        return { currentStart: newStart, currentEnd: newEnd };
      }

      return null;
    });
  };

  pageUp = () => {
    this.setState((state, props) => {
      const maxPosts = props.shows.length - 1;
      const { currentStart, currentEnd } = state;
      if (currentEnd !== maxPosts) {
        let newStart = currentEnd + 1;
        let newEnd =
          newStart + state.pageSize <= maxPosts
            ? newStart + state.pageSize
            : maxPosts;

        return { currentStart: newStart, currentEnd: newEnd };
      }

      return null;
    });
  };
}

ShowList.propTypes = {
  shows: PropTypes.array.isRequired,
  currentPlaying: PropTypes.string.isRequired,
  currentShow: PropTypes.string.isRequired,
  setCurrentPlaying: PropTypes.func.isRequired
};

export default ShowList;
