export default () => (
  <header className="header">
    <div className="header__left">
      <img src="/static/logo.png" alt="Syntax"/>
    </div>
    <div className="header__right">

      <h2 className="tagline">A Tasty Treats Podcast for Web Developers.</h2>

      <div className="people">

        <div className="person">
          <img src="https://pbs.twimg.com/profile_images/623184294521929728/LUJ4qL8n_400x400.jpg" alt="" className="avatar"/>
          <h3>Wes <em>display flex</em> Bos</h3>
          <a href="https://twitter.com/wesbos" className="person__social person__social--twitter">@wesbos</a>
          <p>Full Stack Developer, professional explainer of hard things.</p>
        </div>

        <div className="person">
          <img src="https://pbs.twimg.com/profile_images/430383711448625153/P4yD2jvY_400x400.jpeg" alt="" className="avatar"/>
          <h3>Scott <em>git hunk</em> Tolinski</h3>
          <a href="https://twitter.com/stolinski" className="person__social person__social--twitter">@stolinski</a>
          <p>Web Developer, Creator of @leveluptuts, Bboy, Robotops Crew, Youtuber https://www.youtube.com/c/leveluptuts  https://leveluptutorials.com </p>
        </div>
      </div>

      <div className="subscribe">
        <ul className="subscribe__links">
          <li><a href="itunes">iTunes</a></li>
          <li><a href="itunes">RSS</a></li>
          <li><a href="itunes">Overcast</a></li>
          <li><a href="itunes">Stitcher</a></li>
          <li><a href="itunes">Breaker</a></li>
        </ul>
      </div>

    </div>
  </header>
)
