const platforms = [
  {
    name: 'iTunes',
    url: 'https://itunes.apple.com/ca/podcast/syntax-tasty-web-development-treats/id1253186678?mt=2',
    styleKey: 'itunes'
  },
  {
    name: 'Overcast',
    url: 'https://overcast.fm/itunes1253186678/syntax-tasty-web-development-treats',
    styleKey: 'overcast'
  },
  {
    name: 'Google Podcast',
    url: 'https://www.google.com/podcasts?feed=aHR0cHM6Ly9mZWVkLnN5bnRheC5mbS9yc3M%3D',
    styleKey: 'google'
  },
  {
    name: 'Stitcher',
    url: 'http://www.stitcher.com/s?fid=142440&refid=stpr',
    styleKey: 'stitcher'
  },
  {
    name: 'PocketCasts',
    url: 'http://pca.st/fmx9',
    styleKey: 'pocketcasts'
  },
  {
    name: 'Google Play',
    url: 'https://playmusic.app.goo.gl/?ibi=com.google.PlayMusic&isi=691797987&ius=googleplaymusic&link=https://play.google.com/music/m/Ityd325x5s5ivr3fc74hvvgeztu?t%3DSyntax_-_Tasty_Web_Development_Treats%26pcampaignid%3DMKT-na-all-co-pr-mu-pod-16',
    styleKey: 'googleplay'
  },
  {
    name: 'Spotify',
    url: 'https://open.spotify.com/show/4kYCRYJ3yK5DQbP5tbfZby?si=bOe7-kl6RnOHapMsVnFWgw',
    styleKey: 'spotify'
  },
  {
    name: 'RSS',
    url: 'http://feed.syntax.fm/rss',
    styleKey: 'rss'
  }
];

const ListItem = ({ name, url, styleKey }) => (
  <li className={`subscribe__link subscribe__link--${styleKey}`}>
    <a
      target="_blank"
      href={url}
    >
      {name}
    </a>
  </li>
);

const Subscribe = props => (
  <div className="subscribe">
    <ul className="subscribe__links">
      {platforms.map(platform => <ListItem key={platform.styleKey} {...platform} />)}
    </ul>
  </div>
);

export default Subscribe;
