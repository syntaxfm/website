const { http } = require('@architect/functions');
const { getShows } = require('@architect/shared/shows'); // eslint-disable-line

async function shows() {
  return {
    json: await getShows(),
  };
}

exports.handler = http.async(shows);
