import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import Meta from '../components/meta';
import Page from '../components/Page';
import getBaseURL from '../lib/getBaseURL';

export default class SickPicksPage extends React.Component {
  static propTypes = {
    sickPicks: PropTypes.array.isRequired,
    baseURL: PropTypes.string.isRequired,
  };

  static async getInitialProps({ req }) {
    const baseURL = getBaseURL(req);
    const { data: sickPicks } = await axios.get(`${baseURL}/api/sickpicks`);
    return { sickPicks, baseURL };
  }

  render() {
    const { sickPicks = [], baseURL } = this.props;

    return (
      <Page>
        <Meta baseURL={baseURL} staticPage={{ title: 'Sick Picks' }} />
        <div className="wrapper wrapper--text">
          {sickPicks.map(sickPick => (
            <div
              key={sickPick.id}
              dangerouslySetInnerHTML={{ __html: sickPick.html }} //eslint-disable-line
            />
          ))}
        </div>
      </Page>
    );
  }
}
