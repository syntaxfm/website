import React, { Component } from "react";
import Show from "./Show";
import { EXITED } from "react-transition-group/Transition";

class ShowList extends Component {
  state = {
    shows: [...this.props.shows],
    searchTerm: "",
    searchFocused: false
  };

  filterShows = term => {
    const { shows } = this.props;

    const filteredShows = shows.filter(show => {
      const showNotes = show.html.toString().toLowerCase();
      const ShowTitle = show.title.toString().toLowerCase();
      const formattedTerm = this.state.searchTerm.toLowerCase();

      //this may be better suited for "tags" down the road
      return (
        showNotes.includes(formattedTerm) || ShowTitle.includes(formattedTerm)
      );
    });

    this.setState({
      shows: filteredShows
    });
  };

  handleInputFocus = () => {
    //searchFocused is a toggle for the "show--active"  class
    //of the search input when focused
    this.setState({
      searchFocused: !this.state.searchFocused
    });
  };

  onChange = e => {
    this.setState({
      searchTerm: e.target.value
    });

    //filter shows & set state
    this.filterShows(this.state.searchTerm);
  };

  render = () => {
    const { currentPlaying, currentShow, setCurrentPlaying } = this.props;
    const { shows } = this.state;
    return (
      <div className="showList">
        <div
          className={`${this.state.searchFocused &&
            "show--active"} show show__link`}
        >
          <input
            onBlur={this.handleInputFocus}
            onFocus={this.handleInputFocus}
            className="show-search"
            type="text"
            onChange={e => this.onChange(e)}
            value={this.state.searchTerm}
            placeholder="Search Shows"
          />
        </div>
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
  };
}

export default ShowList;
