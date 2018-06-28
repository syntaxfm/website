import Subscribe from './Subscribe';

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
        <div className="person">
          <img
            src="https://pbs.twimg.com/profile_images/877525007185858562/7G9vGTca_400x400.jpg"
            alt=""
            className="avatar"
          />
          <h3>Wes Bos</h3>
          <a
            target="_blank"
            href="https://twitter.com/wesbos"
            className="person__social person__social--twitter"
          >
            @wesbos
          </a>
          <p>
            Full Stack JavaScript Developer. Creator of really good{' '}
            <a target="_blank" href="https://wesbos.com/courses">
              web development courses
            </a>. BBQ enthusiast.
          </p>
        </div>

        <div className="person">
          <img
            src="https://avatars2.githubusercontent.com/u/669383?s=460&v=4"
            alt=""
            className="avatar"
          />
          <h3>Scott Tolinski</h3>
          <a
            target="_blank"
            href="https://twitter.com/stolinski"
            className="person__social person__social--twitter"
          >
            @stolinski
          </a>
          <p>
            Web Developer, Creator of <a href="https://leveluptutorials.com/">Level Up Tuts</a>,
            Bboy, Robotops Crew and{' '}
            <a target="_blank" href="https://www.youtube.com/c/leveluptuts">
              Youtuber
            </a>
          </p>
        </div>
      </div>
    </div>
    <Subscribe />
  </header>
);

export default Header;
