import { injectGlobal } from 'styled-components';

import { yellow } from './variables'

export default injectGlobal`
  .header {
    display: flex;
    color: #fff;
    flex-wrap: wrap;
    margin: 2rem auto;
  }

  .header__left {
    width: 30%;
    text-align: center;
  }

  @media (max-width: 800px) {
    .header__left {
      width: 100%;
    }
  }

  .header__right {
    width: 70%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  @media (max-width: 800px) {
    .header__right {
      width: 100%;
    }
  }

  .header__logo {
    margin-left: -3rem;
    max-width: 300px;
    text-align: center;
  }

  @media (max-width: 800px) {
    .header__logo {
      margin-left: -2rem;
    }
  }

  .title {
    position: relative;
  }

  .title__potluck-btn {
    border: 1px solid ${yellow};
    border-radius: 3px;
    padding: 5px 10px;
    position: absolute;
    right: 0;
    top: 5px;
    font-size: 12px;
  }

  .title__potluck-btn:hover {
    border: 1px dotted;
  }

  @media (max-width: 1000px) {
    .title__potluck-btn {
      position: relative;
      margin: 10px 0;
      text-align: center;
      display: block;
      top: 0;
    }
  }

  .subscribe {
    width: 100%;
  }

  .subscribe__links {
    margin: 0;
    padding: 0;
    display: flex;
    list-style: none;
    align-items: stretch;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  @media (max-width: 800px) {
    .subscribe__links {
      justify-content: space-between;
    }
  }

  .subscribe__link {
    flex: 0 1 auto;
    margin-bottom: 1rem;
  }

  @media (max-width: 570px) {
    .subscribe__link {
      flex: 1 1 auto;
      margin-right: 1rem;
      margin-bottom: 1rem;
    }
  }

  .subscribe__link a {
    background: ${yellow};
    display: block;
    color: rgba(0, 0, 0, 0.8);
    text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.05);
    font-size: 1.5rem;
    padding: 0.7rem 1rem;
    text-align: center;
    border-radius: 3px;
    font-family: sans-serif;
    font-weight: 100;
    transition: all 0.2s;
    display: flex;
    align-items: center;
  }

  .subscribe__link a:hover {
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.4);
  }

  .subscribe__link a:before {
    display: inline-block;
    width: 20px;
    height: 20px;
    content: '';
    margin-right: 0.7rem;
    background-size: cover;
    border-radius: 5px;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 1000px) {
    .subscribe__link--subscribe {
      display: none;
    }
  }

  .subscribe__link--subscribe a {
    pointer-events: none;
    background: linear-gradient(to bottom, ${yellow} 0%, #f1c260 100%);
    text-decoration: none;
  }

  .subscribe__link--subscribe a:before {
    width: 0;
    box-shadow: none;
    margin: 0;
  }

  .subscribe__link--itunes a {
    background: linear-gradient(to bottom, #cd66f6 0%, #9a3dd1 80%, #8e34c9 100%);
  }

  .subscribe__link--itunes a:before {
    background-image: url("/static/icons/itunes.jpg");
  }

  .subscribe__link--overcast a {
    background: linear-gradient(to bottom, #ff8a0a 0%, #ff6930 100%);
  }

  .subscribe__link--overcast a:before {
    background-image: url("/static/icons/overcast.jpg");
  }

  .subscribe__link--rss a {
    background: linear-gradient(to bottom, #f7a336 0%, #eb6d1e 96%, #eb6c1e 100%);
  }

  .subscribe__link--rss a:before {
    background-image: url("/static/icons/rss.svg");
  }

  .subscribe__link--stitcher a {
    background: linear-gradient(to bottom, #ccd557 0%, #c8d05b 94%);
  }

  .subscribe__link--stitcher a:before {
    background-image: url("/static/icons/stitcher.jpg");
  }

  .subscribe__link--breaker a {
    background: linear-gradient(105deg, #00adea 0%, #15b8ec 100%);
  }

  .subscribe__link--breaker a:before {
    background-image: url("/static/icons/breaker.jpg");
  }

  .subscribe__link--pocketcasts a {
    background: linear-gradient(to bottom, #f22b24 0%, #d70c0b 100%);
  }

  .subscribe__link--pocketcasts a:before {
    background-image: url("/static/icons/pocketcasts.jpg");
  }

  .subscribe__link--googleplay a {
    background: linear-gradient(to bottom, #25bbc3 0%, #38d7df 100%);
  }

  .subscribe__link--googleplay a:before {
    background-image: url("/static/icons/googleplay.png");
    background-color: #fff;
  }

  .subscribe__link--spotify a {
    background: linear-gradient(to bottom, #04a03b 0%, #10ac47 100%);
  }

  .subscribe__link--spotify a:before {
    background-image: url("/static/icons/spotify.svg");
  }

  .subscribe__link--google a {
    background: linear-gradient(to bottom, #f57917 0%, #feb95a 100%);
  }

  .subscribe__link--google a:before {
    background-image: url("/static/icons/google_podcasts.svg");
  }
`;