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
            <a href="https://discord.gg/ccMC6kB" className="live__callin-btn">
              Join the Discord Chat to get on!
            </a>
            <p>
              Friday Oct 30th, 10:30am PST, 1:30 EST.{' '}
              <a href="https://everytimezone.com/s/b5906524">
                Find your timezone
              </a>
            </p>
          </div>
          <VideoPlayer />
        </main>
      </div>
    </Page>
  );
}
