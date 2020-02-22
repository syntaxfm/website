const { http } = require('@architect/functions')
const { getShow } = require('@architect/shared/shows')

async function syntaxfm(req) {
  try {
    let show = await getShow(req.params.number)
    if (show) {
      return { json: show }
    }
    return {
      statusCode: 404,
      json: { message: 'Sorry not found' }
    }
  }
  catch(err) {
    console.error(err)
    return {
      statusCode: 500,
      json: { message: err.message, name: err.name, stack: err.stack }
    }
  }
}

exports.handler = http.async(syntaxfm)
