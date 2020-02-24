import { join } from 'path'
import { readFile } from 'fs'
import { promisify } from 'util'

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import App from './app'
import syntaxfm from './html'

// use cjs to grab the data modules; rollup ignores this b/c we are transpiling to node
let { getShowsSparse } = require('@architect/shared/shows')

// lambda function renderer logic
export async function render(req) {

  const { shows, show } = await getShowsSparse(req.params.number)
  const { path, params } = req
  const jsx = <App path={path} params={params} show={show} shows={shows} />
  const main = ReactDOMServer.renderToString(jsx) 
  const html = syntaxfm({ main, show, shows, path, params })

  return { html }
}
