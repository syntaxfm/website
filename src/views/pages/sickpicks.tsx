import React from 'react';
import Page from '../components/Page';

export default function SickPicksPage(props) {
  return (
    <Page>
      <div className="wrapper wrapper--text">
        {props.picks.map(sickPick => (
          <div
            key={sickPick.id}
            dangerouslySetInnerHTML={{ __html: sickPick.html }} //eslint-disable-line
          />
        ))}
      </div>
    </Page>
  );
}
