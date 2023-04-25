import PropTypes from 'prop-types';

const Bars = ({ isPlaying }) => (
  <div className={`bars ${isPlaying ? '' : 'bars--paused'}`}>
    <div className="bar" />
    <div className="bar" />
    <div className="bar" />
    <div className="bar" />
    <div className="bar" />
    <div className="bar" />
    <div className="bar" />
  </div>
);

Bars.propTypes = {
  isPlaying: PropTypes.bool,
};

export default Bars;
