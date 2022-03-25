import PropTypes from 'prop-types';

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

MyApp.propTypes = {
  Component: PropTypes.node,
  pageProps: PropTypes.any,
};
