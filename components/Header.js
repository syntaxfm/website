import React from "react";

import Subscribe from "./Subscribe";

export default () => (
  <header className="header">
    <div className="header__left">
      <img
        alt="Syntax"
        className="header__logo"
        src="/static/logo.png"
      />
    </div>
    <div className="header__right">
      <h2 className="tagline">A Tasty Treats Podcast for Web Developers.</h2>
      <div className="people">
        <div className="person">
          <img src="https://pbs.twimg.com/profile_images/877525007185858562/7G9vGTca_400x400.jpg" alt="" className="avatar"/>
          <h3>Wes Bos</h3>
          <a href="https://twitter.com/wesbos" className="person__social person__social--twitter">@wesbos</a>
          <p>Full Stack JavaScript Developer. Creator of really good <a target="_blank" href="https://wesbos.com/courses">web development courses</a>. BBQ enthusiast.</p>
        </div>
        <div className="person">
          <img src="https://pbs.twimg.com/profile_images/430383711448625153/P4yD2jvY_400x400.jpeg" alt="" className="avatar"/>
          <h3>Scott Tolinski</h3>
          <a target="_blank" href="https://twitter.com/stolinski" className="person__social person__social--twitter">@stolinski</a>
          <p>Web Developer, Creator of <a href="https://leveluptutorials.com/">Level Up Tuts</a>, Bboy, Robotops Crew and <a target="_blank" href="https://www.youtube.com/c/leveluptuts">Youtuber</a></p>
        </div>
      </div>
      <div className="subscribe">
        <ul className="subscribe__links">
          <Subscribe
            link="https://itunes.apple.com/us/podcast/syntax-tasty-web-development-treats/id1253186678"
            provider="iTunes"
          />
          <Subscribe
            link="https://overcast.fm/itunes1253186678/syntax-tasty-web-development-treats"
            provider="Overcast"
          />
          <Subscribe
            link="https://stitcher.com/s?fid=142440"
            provider="Stitcher"
          />
          <Subscribe
            link="http://pca.st/fmx9"
            provider="PocketCasts"
          />
          <Subscribe
            link="https://play.google.com/music/m/Ityd325x5s5ivr3fc74hvvgeztu"
            provider="Google Play"
          />
          <Subscribe
            link="https://feed.syntax.fm/rss"
            provider="RSS"
          />
        </ul>
      </div>
    </div>
  </header>
);
