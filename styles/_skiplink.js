import { injectGlobal } from 'styled-components';

import { black, yellow } from './variables'

export default injectGlobal`
  .skip-link {
    position: absolute;
    top: -1000px;
    left: -1000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
    border: 2px solid ${yellow};
    padding: 10px 15px;
    font-size: 16px;
    background: ${black};
  }

  .skip-link:active,
  .skip-link:focus,
  .skip-link:hover {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
    width: auto;
    height: auto;
    overflow: visible;
  }
`;