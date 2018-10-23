import styled from 'styled-components';
import theme from './theme';

const StyledButton = styled.button`
  display: inline-block;
  padding: 1rem;
  border: 0;
  background: ${theme.colors.lightgrey};
  color: black;
  line-height: 1;
  transition: all 0.2s;
  &:hover {
    background: #f2f2f2;
  }
`;

export default StyledButton;
