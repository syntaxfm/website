import React from 'react';
import Meta from '../components/meta';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default class Page extends React.Component {
  render() {
    return (
      <div className="page">
        <a href="#main" className="skip-link">Skip to content</a>
        <Header />
        {this.props.children}
        <Footer />
      </div>
    );
  }
}
