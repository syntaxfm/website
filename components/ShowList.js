import Show from './Show';

const ShowList = ({ ...props, shows }) => (
  <div className="showList">
    {shows.map((show) => (
      <Show
        {...props}
        key={show.number}
        show={show}
      />
    ))}
    <div className="show show--dummy" />
  </div>
);

export default ShowList;
