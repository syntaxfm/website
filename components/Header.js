import Subscribe from './Subscribe';

const people = [
  {
    name: 'Wes Bos',
    description: (
      <p>
        Full Stack JavaScript Developer. Creator of really good{' '}
        <a target="_blank" href="https://wesbos.com/courses">
          web development courses
        </a>. BBQ enthusiast.
      </p>
    ),
    imageUrl: '/static/wes400x400.jpg',
    twitterUsername: 'wesbos',
  },
  {
    name: 'Scott Tolinski',
    description: (
      <p>
        Web Developer, Creator of <a href="https://leveluptutorials.com/">Level Up Tuts</a>,
        Bboy, Robotops Crew and{' '}
        <a target="_blank" href="https://www.youtube.com/c/leveluptuts">
          Youtuber
        </a>
      </p>
    ),
    imageUrl: 'https://avatars2.githubusercontent.com/u/669383?s=460&v=4',
    twitterUsername: 'stolinski',
  }
];

const Person = ({ name, imageUrl, twitterUsername, description }) => (
  <div className="person">
    <img src={imageUrl} alt="" className="avatar" />
    <h3>{name}</h3>
    <a
      target="_blank"
      href={`https://twitter.com/${twitterUsername}`}
      className="person__social person__social--twitter"
    >
      @{twitterUsername}
    </a>
    {description}
  </div>
);

const Header = () => (
  <header className="header">
    <div className="header__left">
      <img className="header__logo" src="/static/logo.png" alt="Syntax" />
    </div>
    <div className="header__right">
      <div className="title">
        <h2 className="tagline">A Tasty Treats Podcast for Web Developers.</h2>
        <a
          target="_blank"
          href="https://docs.google.com/forms/d/e/1FAIpQLSfQlAo1wXHiJMySdU-h8QMtfoz92aMS9eycEHXB6eRCLh8KHA/viewform"
          className="title__potluck-btn"
        >
          Ask a Potluck Question →
        </a>
      </div>
      <div className="people">
        {people.map(person => <Person key={person.twitterUsername} {...person} />)}
      </div>
    </div>
    <Subscribe />
  </header>
);

export default Header;
