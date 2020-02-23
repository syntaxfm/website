import React, { useState, useEffect } from 'react';
import Page from '../components/Page';

export default function SickPicksPage(props) {
  const [shows, setShows] = useState([]);
  if (typeof fetch != 'undefined') {
    useEffect(() => {
      !async function() {
        let result = await (await fetch('/api/sickpicks')).json()
        setShows(result)
      }()
    }, []);
  }
  return (
    <Page>
      <div className="wrapper wrapper--text">
        {shows.map(sickPick => (
          <div
            key={sickPick.id}
            dangerouslySetInnerHTML={{ __html: sickPick.html }} //eslint-disable-line
          />
        ))}
      </div>
    </Page>
  );
}
