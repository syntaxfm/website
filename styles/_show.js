import { injectGlobal } from 'styled-components';

import { black, yellow, green, grey, grey3, lightgrey } from './variables'

export default injectGlobal`
  .show {
    border-right: 1px solid ${grey};
    border-bottom: 1px solid ${grey};
    border-left: 10px solid ${grey};
    background: ${lightgrey};
    position: relative;
    display: flex;
  }

  .show a {
    flex: 1 1 auto;
    padding: 10px;
  }

  .show__playcontrols {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 5rem;
    flex-shrink: 0;
    padding: 1rem;
  }

  .show__playcontrols button {
    background: none;
    border: 0;
    outline-color: ${yellow};
  }

  .show__playcontrols button:hover {
    color: ${yellow};
  }

  .show--dummy {
    flex: 1 0 auto;
  }

  .show--active {
    border-right-color: #fff;
    background: #fff;
    border-left: 0;
    padding-left: 1rem;
  }

  .show--active:before {
    display: block;
    background: linear-gradient(30deg, #d2ff52 0%, ${green} 100%);
    width: 10px;
    height: 100%;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
  }

  .show__displayNumber {
    text-transform: uppercase;
    margin: 0;
    color: ${grey3};
    font-size: 11px;
  }

  .show__title {
    color: ${black};
    font-size: 1.5rem;
    margin: 0;
  }

  .show__date {
    margin-top: 0;
    text-align: right;
    color: ${grey3};
    font-size: 1.2rem;
  }

  .show-wrap {
    background: #fff;
    display: flex;
    flex-wrap: wrap;
  }

  .showList {
    width: 38%;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 650px) {
    .showList {
      width: 100%;
    }
  }

  .showNotes {
    padding: 2rem;
    width: 62%;
    font-size: 1.5rem;
  }

  @media (max-width: 650px) {
    .showNotes {
      width: 100%;
    }
  }

  .showNotes .button {
    border-bottom: 0;
  }

  .showNotes ul {
    padding-left: 2rem;
    list-style-type: circle;
  }

  .showNotes li {
    margin: 10px 0;
  }

  .showNotes h1,
  .showNotes h2,
  .showNotes h3,
  .showNotes h4,
  .showNotes h5,
  .showNotes h6 {
    font-family: 'courier';
    font-weight: 100;
    border-bottom: 1px solid ${grey};
    padding-bottom: 1rem;
  }

  .showNotes h1:before,
  .showNotes h2:before,
  .showNotes h3:before,
  .showNotes h4:before,
  .showNotes h5:before,
  .showNotes h6:before {
    padding-right: 1rem;
  }

  .showNotes pre {
    background: ${lightgrey};
    padding: 1rem;
  }

  .showNotes h1,
  .showNotes h2 {
    font-size: 2.5rem;
  }

  .showNotes a {
    color: #4a4a4a;
    border-bottom: 1px solid ${yellow};
    text-decoration: none;
  }
`;