import { injectGlobal } from 'styled-components';

import { black, yellow, green, grey } from './variables'

export default injectGlobal`
  /* // accessible way of hiding inputs and labels */
  .sr-only {
    border: 0 !important;
    clip: rect(1px, 1px, 1px, 1px) !important;
    clip-path: inset(50%) !important;
    height: 1px !important;
    overflow: hidden !important;
    padding: 0 !important;
    position: absolute !important;
    width: 1px !important;
    white-space: nowrap !important;
  }

  .player {
    bottom: 0;
    width: 100%;
    background: ${black};
    border-top: 1px solid ${yellow};
    color: #fff;
    display: flex;
    flex-wrap: wrap;
    position: relative;
    position: sticky;
    position: -webkit-sticky;
    top: -1px;
    z-index: 2;
  }

  .player__section {
    order: 2;
  }

  .player__section--left {
    width: 100px;
    min-width: 80px;
  }

  @media (max-width: 650px) {
    .player__section--left {
      flex: 1;
    }
  }

  .player__section--left>* {
    width: 100%;
  }

  .player__section--middle {
    flex: 1 1 auto;
    border-right: 1px solid rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 650px) {
    .player__section--middle {
      order: 1;
      width: 100%;
    }
  }

  .player__section--right {
    display: flex;
  }

  @media (max-width: 650px) {
    .player__section--right {
      flex: 2;
    }
  }

  .player__section--right>* {
    width: 100%;
  }

  .player__icon {
    font-size: 2rem;
    line-height: 0.5;
  }

  .player__title {
    font-size: 1.5rem;
    margin: 0;
    flex: 1 0 auto;
    display: flex;
    align-items: center;
    padding-left: 2rem;
    max-width: 650px;
  }

  @media (max-width: 650px) {
    .player__title {
      padding: 1rem;
    }
  }

  .player button {
    background: ${black};
    border: 0;
    color: #fff;
    padding: 1rem;
    border-right: 1px solid rgba(0, 0, 0, 0.6);
    outline-color: ${yellow};
  }

  .player__speeddisplay {
    height: 2.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .player__speed {
    flex: 0 1 auto;
    padding: 1rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    flex-direction: column;
    align-items: center;
  }

  .player__speed>* {
    width: 100%;
    margin: 0;
  }

  .player__speed__display {
    height: 2.5rem;
  }

  .player__inputs {
    font-size: 0;
  }

  .player__volume {
    width: 120px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    padding: 1rem;
    flex-wrap: wrap;
    flex: 1 0 auto;
  }

  .player__volume:focus-within {
    outline: -webkit-focus-ring-color auto 5px;
  }

  .player__volume:hover label {
    border-top: 1px solid ${yellow};
  }

  .player__volume label {
    border-top: 1px solid ${green};
  }

  .player__volume label:hover~label {
    border-top: 1px solid ${black};
  }

  .player__volume p {
    width: 100%;
    margin: 0;
  }

  .player__volume input~label {
    background: ${green};
    border-right: 2px solid ${black};
    display: inline-block;
    width: 8px;
    height: 2.5rem;
  }

  .player__volume input:checked~label {
    background: ${grey};
  }

  .player__volume input:checked+label {
    background: ${green};
  }

  .progress {
    background: #0d0d0d;
    height: 2rem;
    cursor: crosshair;
    overflow: hidden;
  }

  .progress__time {
    background: ${green};
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    min-width: 20px;
    height: 100%;
    transition: width 0.1s;
    background: linear-gradient(30deg, #d2ff52 0%, ${green} 100%);
  }
`;