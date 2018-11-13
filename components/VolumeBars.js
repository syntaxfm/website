import React, { Component, Fragment } from 'react';

// data generator
const getItems = count => {
  return Array.from({ length: count }, (v, i) => (i + 1) * 10).map(k => {
    let decimal = k / 100;
    return {
      integer: `${k}`,
      deci: `${decimal}`,
      vol: `vol${k}`,
      level: `Volume Level ${k}/100`
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
          <Fragment key={item.integer}>
            <input
              onChange={this.props.volume}
              type="radio"
              name="volume"
              value={item.deci}
              id={item.vol}
              className="sr-only"
              checked={this.props.checked}
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
