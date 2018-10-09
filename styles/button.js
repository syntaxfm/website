import styled from 'styled-components';

import { lightgrey, grey } from './variables'

export const Button = styled.button`
  border: 0;
  background: ${lightgrey};
  color: #1d1d1d;
  padding: 0;
  line-height: 1;
  font-size: 1.5rem;
  padding: 1rem;
  display: inline-block;
  transition: all 0.2s;

  &:hover {
    background: #f2f2f2;
  }

  & + button,
  & + a {
    margin-left: 1rem;
  }

  .icon {
    border-right: 1px solid ${grey};
    padding-right: 0.5rem;
    margin-right: 0.5rem;
  }
`;

// Import 'BtnA' for a button styled 'anchor' component
export const BtnA = Button.withComponent('a');
