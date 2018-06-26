export default () => (
  <header className="header">
    <div className="header__left">
      <img className="header__logo" src="/static/logo.png" alt="Syntax" />
    </div>
    <div className="header__right">

      <h2 className="tagline">A Tasty Treats Podcast for Web Developers.</h2>

      <div className="people">

        <div className="person">
          <img src="https://pbs.twimg.com/profile_images/877525007185858562/7G9vGTca_400x400.jpg" alt="" className="avatar" />
          <h3>Wes Bos</h3>
          <a target="_blank" href="https://twitter.com/wesbos" className="person__social person__social--twitter">@wesbos</a>
          <p>Full Stack JavaScript Developer. Creator of really good <a target="_blank" href="https://wesbos.com/courses">web development courses</a>. BBQ enthusiast.</p>
        </div>

        <div className="person">
          <img src="https://avatars2.githubusercontent.com/u/669383?s=460&v=4" alt="" className="avatar" />
          <h3>Scott Tolinski</h3>
          <a target="_blank" href="https://twitter.com/stolinski" className="person__social person__social--twitter">@stolinski</a>
          <p>Web Developer, Creator of <a href="https://leveluptutorials.com/">Level Up Tuts</a>, Bboy, Robotops Crew and <a target="_blank" href="https://www.youtube.com/c/leveluptuts">Youtuber</a></p>
        </div>
      </div>

      <div className="subscribe">
        <ul className="subscribe__links">
          <li className="subscribe__link subscribe__link--itunes"><a target="_blank" href="https://itunes.apple.com/ca/podcast/syntax-tasty-web-development-treats/id1253186678?mt=2">iTunes</a></li>
          <li className="subscribe__link subscribe__link--overcast"><a target="_blank" href="https://overcast.fm/itunes1253186678/syntax-tasty-web-development-treats">Overcast</a></li>
          <li className="subscribe__link subscribe__link--stitcher"><a target="_blank" href="http://www.stitcher.com/s?fid=142440&refid=stpr">Stitcher</a></li>
          <li className="subscribe__link subscribe__link--pocketcasts"><a target="_blank" href="http://pca.st/fmx9">PocketCasts</a></li>
          <li className="subscribe__link subscribe__link--googleplay"><a target="_blank" href="https://playmusic.app.goo.gl/?ibi=com.google.PlayMusic&isi=691797987&ius=googleplaymusic&link=https://play.google.com/music/m/Ityd325x5s5ivr3fc74hvvgeztu?t%3DSyntax_-_Tasty_Web_Development_Treats%26pcampaignid%3DMKT-na-all-co-pr-mu-pod-16">Google Play</a></li>
          <li className="subscribe__link subscribe__link--rss"><a target="_blank" href="http://feed.syntax.fm/rss">RSS</a></li>
          <li className="subscribe__link subscribe__link--spotify"><a target="_blank" href="https://open.spotify.com/show/4kYCRYJ3yK5DQbP5tbfZby?si=bOe7-kl6RnOHapMsVnFWgw">Spotify</a></li>
        </ul>
      </div>

    </div>
  </header>
)
