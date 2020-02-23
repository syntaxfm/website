import React from 'react'
import ReactDOM from 'react-dom'
import App from './app'

// @ts-ignore
let {shows, show, params, path} = window.STATE

// first render
let main = document.getElementById('js-main')
ReactDOM.hydrate(<App path={path} params={params} shows={shows} show={show} />, main)
