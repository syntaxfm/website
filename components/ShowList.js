import React from "react";
import PropTypes from "prop-types";
import Show from "./Show";

class ShowList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { beginSliceAt: 0, pageSize: 10, numOfShows: 0 };
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
        {this.getShortList(shows).map(show => (
          <Show
            setCurrentPlaying={setCurrentPlaying}
            currentPlaying={currentPlaying}
            currentShow={currentShow}
            key={show.number}
            show={show}
          />
        ))}
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
          <span className="pageUpDown"> Next &gt;&gt;</span>
        </div>
        <div className="show show--dummy" />
      </div>
    );
  }

  getShortList = shows => {
    if (shows.length !== this.state.numOfShows) {
      this.setState({ numOfShows: shows.length });
    }
    return shows.slice(this.state.beginSliceAt, this.state.pageSize + 1);
  };

  pageDown = () => {
    let newBeginning = this.state.beginSliceAt - this.state.pageSize;

    if (newBeginning < 0) {
      newBeginning = 0;
    }

    this.setState({ beginSliceAt: newBeginning });
  };

  pageUp = () => {
    let newBeginning = this.state.beginSliceAt + this.state.pageSize;

    if (newBeginning <= this.state.numOfShows) {
      this.setState({ beginSliceAt: newBeginning });
    }
  };
}

ShowList.propTypes = {
  shows: PropTypes.array.isRequired,
  currentPlaying: PropTypes.string.isRequired,
  currentShow: PropTypes.string.isRequired,
  setCurrentPlaying: PropTypes.func.isRequired
};

export default ShowList;
