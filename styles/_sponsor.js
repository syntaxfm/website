import { injectGlobal } from 'styled-components';

import { black, yellow } from './variables'

export default injectGlobal`
  figure,
  figcaption {
    font-size: 10px;
    text-align: right;
  }

  .wrapper--text ul,
  .wrapper--text ol {
    list-style: square;
  }

  .wrapper--text strong {
    font-weight: 900;
  }

  .wrapper--text h1 {
    font-size: 50px;
    margin-top: 0;
    margin-bottom: 0;
  }

  .wrapper--text h2 {
    font-size: 40px;
  }

  .wrapper--text h1,
  .wrapper--text h2 {
    padding-bottom: 10px;
    border-bottom: 2px solid ${yellow};
  }

  .wrapper--text a {
    color: ${black};
    border-bottom: 1px solid ${yellow};
  }
`;