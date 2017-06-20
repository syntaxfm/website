import React from 'react'
import Show from './Show';
import dynamic from 'next/dynamic';
const DynamicComponentWithNoSSR = dynamic(
  import('react-audioplayer'),
  { ssr: false }
)

// const Audio = isBrowser ? require('react-audioplayer') : <p>hi</p>;
// import Audio from 'react-audioplayer';

export default class Player extends React.Component {
  constructor() {
    super();
  }

  // componentDidMount() {
  //   // conditionally require components that can't be rendered server side
  //   Audio = require('react-audioplayer');
  //   this.setState({ client: true });
  // }

  render() {
    const { show } = this.props;
    return (
      <div className="player">
        <hr/>
        <h3>Currently Playing: {show.title}</h3>
        <DynamicComponentWithNoSSR controls src={{src: show.url, name: show.title}}></DynamicComponentWithNoSSR>
        <hr/>
      </div>
    );
  }
}
