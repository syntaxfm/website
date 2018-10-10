import styled from 'styled-components';
import { green } from '../styles'

export default () => (
  <Bars className="bars bars--paused">
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
  </Bars>
)

const Bars = styled.div`
  height: 30px;
  width: 40px;
  position: relative;

  .bar {
    background: ${green};
    bottom: 1px;
    height: 3px;
    position: absolute;
    width: 3px;
    animation: sound 0ms -800ms linear infinite alternate;
  }

  @keyframes sound {
    0% {
      opacity: 0.35;
      background: #f1c15d;
      height: 3px;
    }
    100% {
      opacity: 1;
      background: #eca920;
      height: 28px;
    }
  }

  .bars--paused > * {
    animation-play-state: paused;
  }

  .bar:nth-child(1) {
    left: 1px;
    animation-duration: 474ms;
  }

  .bar:nth-child(2) {
    left: 5px;
    animation-duration: 433ms;
  }

  .bar:nth-child(3) {
    left: 9px;
    animation-duration: 407ms;
  }

  .bar:nth-child(4) {
    left: 13px;
    animation-duration: 458ms;
  }

  .bar:nth-child(5) {
    left: 17px;
    animation-duration: 400ms;
  }

  .bar:nth-child(6) {
    left: 21px;
    animation-duration: 427ms;
  }

  .bar:nth-child(7) {
    left: 25px;
    animation-duration: 441ms;
  }

  .bar:nth-child(8) {
    left: 29px;
    animation-duration: 419ms;
  }

  .bar:nth-child(9) {
    left: 33px;
    animation-duration: 487ms;
  }

  .bar:nth-child(10) {
    left: 37px;
    animation-duration: 442ms;
  }
`;
