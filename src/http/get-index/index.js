let { http } = require('@architect/functions')
let { render } = require('@architect/views/dist/ssr')

exports.handler = http.async(render) 
