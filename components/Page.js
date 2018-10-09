import React from 'react';
import Meta from '../components/meta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import stylesheet from '../styles/style.styl';

import '../styles/index';
import '../styles/_normalize';
import '../styles/_type';
import '../styles/_layout';
import '../styles/_skiplink';
import '../styles/_header';
import '../styles/_person';
import '../styles/_player';
import '../styles/_bars';
import '../styles/_footer';
import '../styles/_show';
import '../styles/_button';
import '../styles/_sponsor';

export default class Page extends React.Component {
  render() {
    return (
      <div className="page">
        <a href="#main" className="skip-link">Skip to content</a>
        <Header />
        <style dangerouslySetInnerHTML={{ __html: stylesheet.replace(/\n/g, '') }} />
        {this.props.children}
        <Footer />
      </div>
    );
  }
}
