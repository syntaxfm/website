module.exports = {
  rewrites() {
    return [
      {
        source: '/',
        destination: '/show/latest/latest',
      },
    ];
  },
};
