const { http } = require('@architect/functions');
const { getSickPicks } = require('@architect/shared/shows'); // eslint-disable-line

async function sickpicks() {
  return {
    json: await getSickPicks(),
  };
}

exports.handler = http.async(sickpicks);
