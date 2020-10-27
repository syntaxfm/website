import ReactHlsPlayer from 'react-hls-player';

export default function VideoPlayer() {
  return (
    <ReactHlsPlayer
      url="https://stream.mux.com/K4SmOZ2s32j4kxoBt7sPH01wtwt00c02qxj.m3u8"
      autoplay
      controls
      width="100%"
      height="auto"
    />
  );
}
