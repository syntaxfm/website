import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Footer from './Footer';
import stylesheet from '../styles/style.styl';

const Page = ({ children }) => (
  <div className="page">
    <a href="#main" className="skip-link">Skip to content</a>
    <Header />
    <style dangerouslySetInnerHTML={{ __html: stylesheet.replace(/\n/g, '') }} />
    {children}
    <Footer />
  </div>
);

export default Page;

Page.propTypes = {
  children: PropTypes.arrayOf(PropTypes.node).isRequired,
};

PropTypes.defaultProps = {
  children: [],
};
