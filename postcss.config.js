module.exports = {
  plugins: [
    // keep this first
    require('postcss-easy-import')({ prefix: '_' }),
    // so imports are auto-prefixed too
    require('autoprefixer')(),
  ],
};
