import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Footer from './Footer';
import stylesheet from '../styles/style.styl';

export default class Page extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]).isRequired,
  };

  render() {
    const { children } = this.props;
    return (
      <div className="page">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <style
          dangerouslySetInnerHTML={{ __html: stylesheet.replace(/\n/g, '') }}
        />
        {children}
        <Footer />
      </div>
    );
  }
}
