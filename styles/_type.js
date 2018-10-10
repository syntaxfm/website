import { injectGlobal } from 'styled-components';

export default injectGlobal`
  @font-face {
    font-family: '💪';
    src:  url('/static/fonts/Radnika-Bold.woff2') format('woff2'),
          url('/static/fonts/Radnika-Bold.woff') format('woff')
  }

  h1,h2,h3,h4,h5,h6 {
    font-family: '💪';
    font-weight: 100;
  }

  @font-face {
    font-family: 'rad';
    src:  url('/static/fonts/Radnika-Light.woff2') format('woff2'),
          url('/static/fonts/Radnika-Light.woff') format('woff');
  }
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
