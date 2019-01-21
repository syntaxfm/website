// WIP

// TODO Figure out the double second thing

function hhmmss(seconds) {
  // start with some seconds
  const seconds = 3858; // eslint-disable-line
  // make a blank date
  const date = new Date(null);
  // set the seconds on it
  date.setSeconds(seconds);
  // pull a utc timestamp
  const timestamp = date.toUTCString();
  console.log(timestamp); // Thu, 01 Jan 1970 01:04:18 GMT
  // parse timestamp somehow, I wrote this terrible regex don't @ me
  const hms = timestamp.match(/\d\d:\d\d:\d\d/)[0].split(':');
  return hms;
  // by default the values are padded.
  // const [hh, mm, ss] = hms; // gives us 01,04,18
}
function makeTimeStamp() {
  const audio = document.querySelector('video');
  const date = new Date(null);
  date.setSeconds(audio.currentTime);
  const [timestamp] = date.toUTCString().match(/\d\d:\d\d:\d\d/);
  console.log(timestamp);
}
