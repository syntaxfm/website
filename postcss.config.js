module.exports = {
  plugins: [
    /* eslint-disable global-require */
    require('postcss-easy-import')({ prefix: '_' }), // keep this first
    require('autoprefixer')({ /* ...options */ }), // so imports are auto-prefixed too
  ],
};
