import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import Meta from '../components/meta';
import Page from '../components/Page';
import getBaseURL from '../lib/getBaseURL';

export default class TwoHundy extends React.Component {
  static propTypes = {
    baseURL: PropTypes.string.isRequired,
  };

  static async getInitialProps({ req }) {
    const baseURL = getBaseURL(req);
    return { baseURL };
  }

  render() {
    const { baseURL } = this.props;

    return (
      <Page>
        <Meta baseURL={baseURL} staticPage={{ title: 'Sick Picks' }} />
        <div className="wrapper wrapper--text">
          <h2>Episode 200!</h2>
          <p>
            Ask us anything in the form below and tune in around 11:30ET for a
            live stream!
          </p>
          <div
            style={{
              left: 0,
              width: '100%',
              height: 0,
              position: 'relative',
              paddingBottom: '56.25%',
            }}
          >
            <iframe
              title="Live Stream"
              src="https://www.youtube.com/embed/live_stream?channel=UCyU5wkjgQYGRB0hIHMwm2Sg"
              style={{
                border: '0',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                position: 'absolute',
              }}
              allowFullScreen
              scrolling="no"
              allow="encrypted-media; accelerometer; gyroscope; picture-in-picture"
            ></iframe>
          </div>
          <p>
            Huge thanks to{' '}
            <a href="https://pigeonhole.at" target="_blank">
              Pigeon Hole
            </a>{' '}
            for supplying the software for this Q+A. 👇🏻
          </p>
          <iframe
            title="Two Hundred"
            src="https://pigeonhole.at/TASTY/q/385778"
            frameBorder="0"
            style={{
              width: '100%',
              height: '1000px',
            }}
          ></iframe>
        </div>
      </Page>
    );
  }
}
