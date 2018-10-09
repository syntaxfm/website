import styled from 'styled-components';

export default () => (
  <Footer className="bottom">
    <p>
      Want to <a href="/sponsor">Sponsor the Podcast?</a>
    </p>
    <p>&copy; Wes Bos && Scott Tolinski {new Date().getFullYear()}</p>
    <p>
      Website made with React, Next.js and stylus. Hosted on Now. The source is on{' '}
      <a href="https://github.com/wesbos/syntax" target="_blank">
        GitHub
      </a>.
    </p>
  </Footer>
);

const Footer = styled.footer`
  text-align: center;
  color: #fff;
`;
