import React from 'react'
import ReactDOM from 'react-dom'
import App from './app'

// @ts-ignore
const { shows, show, params, path } = window.STATE
const main = document.getElementById('js-main')
const jsx = <App path={path} params={params} shows={shows} show={show} />

ReactDOM.hydrate(jsx, main)
