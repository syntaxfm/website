const { http } = require('@architect/functions')
const { getShows } = require('@architect/shared/shows')

async function shows() {
  return { 
    json: await getShows()
  }
}

exports.handler = http.async(shows)
