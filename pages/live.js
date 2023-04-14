import dynamic from 'next/dynamic';
import Page from '../components/Page';
import Meta from '../components/meta';

const VideoPlayer = dynamic(() => import('../components/VideoPlayer'), {
  ssr: false,
});

export default function Live() {
  return (
    <Page>
      <Meta staticPage={{ title: 'Syntax Live 🎙️🔴' }} />
      <div className="wrapper">
        <main className="live-wrap" id="main" tabIndex="-1">
          <div className="live__callin-callout">
            <p className="live__callin-alert">
              Join the fun & call into the show!
            </p>
            <p>
              Ask a potluck question, give us your sick pick, do a shameless
              plug or have us ask you a Stump'd question!
            </p>
            <a
              href="https://riverside.fm/studio/syntax-live"
              className="live__callin-btn"
            >
              Join the Riverside to get on! Will be streaming here and on
              YouTube as well.
            </a>
            <p>TODAY, 12PM ET </p>
          </div>
          <VideoPlayer />
        </main>
      </div>
    </Page>
  );
}
