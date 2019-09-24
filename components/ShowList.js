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
          <span className="pageUpDown" onClick={this.pageDown}>
            &lt;&lt; Previous{" "}
          </span>
          <input
            type="number"
            name="pageSize"
            min="1"
            max="25"
            value={this.state.pageSize}
          ></input>
          <span className="pageUpDown" onClick={this.pageUp}>
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

  getShortList = shows => {
    if (shows.length !== this.state.numOfShows) {
      this.setState({ numOfShows: shows.length });
    }
    return shows.slice(this.state.currentStart, this.state.currentEnd);
  };

  pageDown = () => {
    const state = this.state;
    const propse = this.props;
    this.setState((state, props) => {
      const { currentStart, currentEnd } = state;
      let newStart =
        currentStart - state.pageSize >= 0 ? currentStart - state.pageSize : 0;
      let newEnd =
        currentEnd - state.pageSize >= state.pageSize
          ? currentEnd - state.pageSize
          : state.pageSize;

      return { currentStart: newStart, currentEnd: newEnd };
    });
  };

  pageUp = () => {
    const state = this.state;
    const propse = this.props;
    this.setState((state, props) => {
      const maxPosts = props.shows.length - 1;
      const { currentStart, currentEnd } = state;
      let newStart =
        currentStart + state.pageSize <= maxPosts
          ? currentStart + state.pageSize
          : maxPosts - state.pageSize;
      let newEnd =
        currentEnd + state.pageSize <= maxPosts
          ? currentEnd + state.pageSize
          : maxPosts - 1;

      return { currentStart: newStart, currentEnd: newEnd };
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
