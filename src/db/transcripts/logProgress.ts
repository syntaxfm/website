let duration = 0;

const ts2sec = (ts: string) => {
  const [h, m, s] = ts.split(':');
  return (parseFloat(h) * 60 * 60) + (parseFloat(m) * 60) + parseFloat(s);
};

export const logProgress = (message: string) => {
  if (typeof message === 'string') {
    if (message.startsWith('  Duration')) {
      const ts = message.split(', ')[0].split(': ')[1];
      const d = ts2sec(ts);
      // Add duration to total
      duration += d;
    } else if (message.startsWith('frame') || message.startsWith('size')) {
      const ts = message.split('time=')[1].split(' ')[0];
      const t = ts2sec(ts);
      const percent = Math.round(t / duration * 100);
      console.log(`FFMpeg Merging ${percent.toString()}%`);
    } else if (message.startsWith('video:')) {
      // Reset duration
      duration = 0;
    }
  }
};
