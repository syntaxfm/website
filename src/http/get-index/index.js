let arc = require('@architect/functions')
let ssr = require('@architect/shared/dist/render')

exports.handler = arc.http.async(ssr) 
