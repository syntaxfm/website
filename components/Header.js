import { useState } from 'react';
import Link from 'next/link';
import Subscribe from './Subscribe';
import SubmitModal from './SubmitModal';

const Header = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="header__left">
        <Link href="/">
          <a aria-label="Syntax.FM">
            <img className="header__logo" src="/static/logo.png" alt="Syntax" />
          </a>
        </Link>
      </div>
      <div className="header__right">
        <div className="title">
          <h2 className="tagline">
            A Tasty Treats Podcast for Web Developers.
          </h2>
          <button
            type="button"
            className="title__submit-btn"
            onClick={() => setOpen(!open)}
          >
            Submit your stuff!
          </button>
        </div>
        <div className="people">
          <div className="person">
            <img
              src="https://avatars.githubusercontent.com/wesbos?size=200"
              alt="Wes Bos"
              className="avatar"
            />
            <h3>Wes Bos</h3>
            <a
              target="_blank"
              href="https://twitter.com/wesbos"
              className="person__social person__social--twitter"
              rel="noopener noreferrer"
            >
              @wesbos
            </a>
            <p>
              Full Stack JavaScript Developer. Creator of really good{' '}
              <a
                target="_blank"
                href="https://wesbos.com/courses"
                rel="noopener noreferrer"
              >
                web development courses
              </a>
              . BBQ enthusiast.
            </p>
          </div>

          <div className="person">
            <img
              src="https://avatars.githubusercontent.com/stolinski?size=200"
              alt="Scott Tolinski"
              className="avatar"
            />
            <h3>Scott Tolinski</h3>
            <a
              target="_blank"
              href="https://twitter.com/stolinski"
              className="person__social person__social--twitter"
              rel="noopener noreferrer"
            >
              @stolinski
            </a>
            <p>
              Web Developer, Creator of{' '}
              <a href="https://leveluptutorials.com/">Level Up Tuts</a>, Bboy,
              Robotops Crew and{' '}
              <a
                target="_blank"
                href="https://www.youtube.com/c/leveluptuts"
                rel="noopener noreferrer"
              >
                Youtuber
              </a>
            </p>
          </div>
        </div>
      </div>
      <Subscribe />
      {open && <SubmitModal open={open} setOpen={setOpen} />}
    </header>
  );
};

export default Header;
