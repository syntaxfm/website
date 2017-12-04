import React from 'react';
import Meta from '../components/meta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import stylesheet from '../styles/style.styl';

export default class Page extends React.Component {
  render() {
    return (
      <div className="page">
        <Header />
        <style dangerouslySetInnerHTML={{ __html: stylesheet.replace(/\n/g, '') }} />
        {this.props.children}
        <Footer />
      </div>
    );
  }
}
