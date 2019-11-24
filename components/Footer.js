import Link from 'next/link';

const Footer = () => (
  <footer className="bottom">
    <p>
      Want to{' '}
      <Link href="/sponsor">
        <a>Sponsor the Podcast?</a>
      </Link>
    </p>
    <p>
      Looking for some{' '}
      <Link href="/sickpicks">
        <a>Sick Picks?</a>
      </Link>
    </p>
    <p>&copy; Wes Bos && Scott Tolinski {new Date().getFullYear()}</p>
    <p>
      Website made with React, Next.js and stylus. Hosted on Now. The source is
      on{' '}
      <a
        href="https://github.com/wesbos/syntax"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
      .
    </p>
  </footer>
);

export default Footer;
