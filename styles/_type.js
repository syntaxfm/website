import { injectGlobal } from 'styled-components';

export default injectGlobal`
  html {
    font-size: 10px;
  }
  body {
    font-family: 'rad';
    color: #1d1d1d;
    line-height: 1.5;
  }
  li {
    line-height: 1.7;
  }
  a {
    color: #f1c15d;
    text-decoration: none;
  }
  .tagline {
    font-size: 2.5rem;
    margin: 0;
  }
  @media (max-width: 1000px) {
    .tagline {
      text-align: center;
    }
  }
  @media (max-width: 800px) {
    .tagline {
      font-size: 1.5rem;
    }
  }
`;
