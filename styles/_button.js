import { injectGlobal } from 'styled-components';

import { lightgrey, grey } from './variables'

export default injectGlobal`
  .button,
  a.button {
    border: 0;
    background: ${lightgrey};
    color: #1d1d1d;
    padding: 0;
    line-height: 1;
    font-size: 1.5rem;
    padding: 1rem;
    display: inline-block;
    transition: all 0.2s;
  }

  .button:hover,
  a.button:hover {
    background: #f2f2f2;
  }

  .button+.button,
  a.button+.button {
    margin-left: 1rem;
  }

  .button .icon,
  a.button .icon {
    border-right: 1px solid ${grey};
    padding-right: 0.5rem;
    margin-right: 0.5rem;
  }
`;