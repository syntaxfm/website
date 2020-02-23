const { http } = require('@architect/functions');
const { render } = require('@architect/views/dist/ssr'); // eslint-disable-line

exports.handler = http.async(render);
