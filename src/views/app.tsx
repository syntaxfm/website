import React from 'react'
import TwoHundy from './pages/200'
import IndexPage from './pages/index'
import SickPicks from './pages/sickpicks'
import Sponsor from './pages/sponsor'
import NotFound from './pages/404'

const routes = {
  '/': IndexPage,
  '/sickpicks': SickPicks,
  '/sponsor': Sponsor,
  '/200': TwoHundy
}

// path, params, query, show, shows
export default function App(props) {
  //console.log('app received props:', props.show.number)
  if (props.params.number) 
    return <IndexPage {...props} />
  if (!routes[props.path])
    return <NotFound/>
  return new routes[props.path](props)
}
