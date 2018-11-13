import React, { Component, Fragment } from 'react';

// fake data generator
const getItems = count => {
  return Array.from({ length: count }, (v, i) => (i + 1) * 10).map(k => {
    let decimal = k / 100;
    return {
      // id: `item-${k}`,
      integer: `${k}`,
      deci: `${decimal}`,
      vol: `vol${k}`,
      level: `Volume LevelLL ${k}/100`
    };
  }); // END MAP
}; // END ARROW

class VolumeBars extends Component {
  state = {
    volumeBarList: getItems(10)
  };

  render() {
    return (
      <Fragment>
        {this.state.volumeBarList.map((item, index) => (
          <Fragment>
            <input
              onChange={this.volume}
              type="radio"
              name="volume"
              value={item.deci}
              id={item.vol}
              className="sr-only"
              checked={this.checked}
            />
            <label htmlFor={item.vol}>
              <span className="sr-only">{item.level}</span>
            </label>
          </Fragment>
        ))}
      </Fragment>
    );
  }
}

export default VolumeBars;
