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
        <main className="show-wrap" id="main" tabIndex="-1">
          <VideoPlayer />
        </main>
      </div>
    </Page>
  );
}
