import React from 'react'
import ReactDOM from 'react-dom'
import App from './app'

let main = document.getElementById('js-main')
let path = window.location.pathname
// @ts-ignore
let shows = window.STATE 

ReactDOM.hydrate(<App path={path} shows={shows}/>, main)
