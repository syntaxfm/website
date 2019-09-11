import React from 'react';
import PropTypes from 'prop-types';
import slug from 'speakingurl';
import Router from 'next/router';
import { FaPlay } from 'react-icons/fa';
import Bars from './bars';

const POTLUCK_CLASS = 'show--potluck'
const HASTY_TREAT_CLASS = 'show--hasty-treat'
const REGULAR_SHOW_CLASS = 'show--regular'

export default class Show extends React.Component {
  static propTypes = {
    show: PropTypes.object.isRequired,
    currentPlaying: PropTypes.string.isRequired,
    currentShow: PropTypes.string.isRequired,
    setCurrentPlaying: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props)
    this.state = {
      showTypeClass: ''
    };
  }

  componentDidMount() {
    const { title } = this.props.show
    if (title.toLowerCase().indexOf('potluck') > -1) {
      this.setState({
        showTypeClass: POTLUCK_CLASS
      })
    } else if (title.toLowerCase().indexOf('hasty treat') > -1) {
      this.setState({
        showTypeClass: HASTY_TREAT_CLASS
      })
    } else {
      this.setState({
        showTypeClass: REGULAR_SHOW_CLASS
      })
    }
  }

  changeURL = (e, show) => {
    e.preventDefault();
    const { href } = e.currentTarget;
    Router.push(`/?number=${show.displayNumber}`, href, { shallow: true });
  };

  render() {
    const { show, currentPlaying, currentShow, setCurrentPlaying } = this.props;
    const { showTypeClass } = this.state
    return (
      <div className={`show ${currentPlaying === show.displayNumber ? 'show--playing' : ''} ${currentShow === show.displayNumber ? 'show--active' : ''} ${showTypeClass}`}>
        <a
          className="show__link"
          href={`/show/${show.displayNumber}/${slug(show.title)}`}
          onClick={e => this.changeURL(e, show)}
        >
          <p className="show__displayNumber">Episode {show.displayNumber}</p>
          <h3 className="show__title">{show.title}</h3>
        </a>

        <div className="show__playcontrols">
          {currentPlaying === show.displayNumber ? (
            <Bars />
          ) : (
            <button
              type="button"
              onClick={() => setCurrentPlaying(show.displayNumber)}
              className="show__play"
              title="play button"
            >
              <FaPlay />
            </button>
          )}
        </div>
      </div>
    );
  }
}
