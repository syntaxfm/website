import { injectGlobal } from 'styled-components';

import { black, yellow } from './variables'

export default injectGlobal`
  .wrapper,
  .header,
  .footer {
    max-width: 1000px;
    margin: 0 auto;
  }

  .wrapper--text,
  .header--text,
  .footer--text {
    background: #fff;
    padding: 2rem;
    font-size: 1.7rem;
  }

  @media (max-width: 1000px) {

    .wrapper,
    .header,
    .footer {
      padding: 0 2rem;
    }
  }

  body {
    background: ${black} url("/static/background.jpg");
    border-top: 3px solid ${yellow};
  }
`;