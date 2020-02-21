const { http } = require('@architect/functions')
const { getShow } = require('@architect/shared/shows')

async function syntaxfm() {
  let show = await getShow(req.params.number)
  if (show) {
    return { json: show }
  }
  return {
    statusCode: 404,
    json: { message: 'Sorry not found' }
  }
}

exports.handler = http.async(syntaxfm)
