const Bars = ({isPlaying}) => (
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

export default Bars;
