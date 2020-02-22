import React from 'react'
import Header from './Header';
import Footer from './Footer';

export default function Page({ children }) {
  return (
    <div className="page">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      {children}
      <Footer />
    </div>
  );
}
