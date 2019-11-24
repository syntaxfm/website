/* eslint-disable no-plusplus */
/* eslint-disable jsx-a11y/label-has-for */
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

// TODO Fix all eslint issues

// data generator -> to create 10 volume bars
const getItems = count =>
  Array.from({ length: count }, (v, i) => (i + 1) * 10).map(k => {
    const decimal = k / 100;
    return {
      integer: `${k}`,
      deci: `${decimal}`,
      vol: `vol${k}`,
      level: `Volume Level ${k}/100`,
      checked: true,
    };
  }); // END MAP // END ARROW
class VolumeBars extends Component {
  state = {
    volumeBarList: getItems(10),
  };

  static propTypes = {
    volume: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const localKey = `lastVolumeBarsOn`;
    const localStorageRef = localStorage.getItem(localKey);
    if (localStorageRef) {
      this.setState({ volumeBarList: JSON.parse(localStorageRef) });
    }
  }

  componentDidUpdate() {
    const localKey = `lastVolumeBarsOn`;
    const { volumeBarList } = this.state;
    const localValue = JSON.stringify(volumeBarList);
    localStorage.setItem(localKey, localValue);
  }

  // We are going to track which volume bars are "checked"
  handleOnClick = index => {
    // make a copy of state
    const { volumeBarList } = this.state;
    const volumeBarListCopy = [...volumeBarList];
    // Get the index positions from 0 till index (index clicked)
    for (let i = 0; i <= index; i++) {
      volumeBarListCopy[i].checked = true;
    }
    // Get the index positions of the remaining non-checked
    for (let i = index + 1; i < 10; i++) {
      volumeBarListCopy[i].checked = null;
    }
    // Update State
    this.setState({
      volumeBarList: volumeBarListCopy,
    });
  };

  render() {
    const { volume } = this.props;
    const { volumeBarList } = this.state;
    return (
      <Fragment>
        {volumeBarList.map((item, index) => (
          <Fragment key={item.integer}>
            <input
              onClick={() => {
                this.handleOnClick(index);
              }}
              onChange={volume}
              type="radio"
              name="volume"
              value={item.deci}
              id={item.vol}
              className="sr-only"
            />
            <label
              htmlFor={item.vol}
              style={
                item.checked
                  ? { background: '#03fff3' }
                  : { background: '#e4e4e4' }
              }
            >
              <span className="sr-only">{item.level}</span>
            </label>
          </Fragment>
        ))}
      </Fragment>
    );
  }
}

export default VolumeBars;
