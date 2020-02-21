const { http } = require('@architect/functions')
const { getAllShowSickPicks } = require('@architect/shared/shows')

async function sickpicks(req) {
  return { 
    json: await getSickPicks()
  }
}

exports.handler = http.async(sickpicks)
