import ReactHlsPlayer from 'react-hls-player';

export default function VideoPlayer() {
  return (
    <div
      style={{
        marginTop: '2rem',
        boxShadow: '1px 1px 10px rgba(0,0,0,1)',
      }}
    >
      <ReactHlsPlayer
        url="https://stream.mux.com/ASlzqxSwpCm6D8hNftrvMnI003z2kYaCi.m3u8"
        autoplay
        controls
        width="100%"
        poster="static/live-poster.png"
        height="auto"
      />
    </div>
  );
}
