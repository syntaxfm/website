import { injectGlobal } from 'styled-components';

export default injectGlobal`
  .people {
    display: flex;
    justify-content: space-between;
    margin: 1rem 0;
    flex-wrap: wrap;
  }

  .person {
    background: rgba(255, 255, 255, 0.07);
    padding: 1rem;
    width: 48%;
  }

  @media (max-width: 800px) {
    .person {
      width: 100%;
      margin-bottom: 1rem;
    }
  }

  .person p {
    margin-bottom: 0;
  }

  .person h3 {
    margin: 0;
    font-size: 2rem;
  }

  .person h3 em {
    font-size: 1rem;
  }

  .avatar {
    border-radius: 50%;
    width: 80px;
    float: left;
    margin-right: 20px;
    border: 3px solid #fff;
    box-shadow: inset 0 0 10px #f00;
  }

  @media (max-width: 800px) {
    .avatar {
      width: 50px;
      border-width: 1px;
    }
  }
`;