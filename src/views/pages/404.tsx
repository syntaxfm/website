import React from 'react';
import Page from '../components/Page';

export default function NotFound() {
  return (
    <Page>
      <div className="wrapper wrapper--text">
        <h2>Not found!</h2>
        <p>oops! super sorry about that. <a href="/">click here to go back home.</a></p>
      </div>
    </Page>
  )
}
