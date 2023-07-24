const path = require('path');
const glob = require('glob');

module.exports = {
  rewrites() {
    return [
      {
        source: '/',
        destination: '/show/latest/latest',
      },
      {
        source:'/show/:id/:slug',
        destination: '/show/:id'
      }
    ];
  },
  webpack: (config) => {
    config.module.rules.push(
      {
        test: /\.(css|styl)/,
        loader: 'emit-file-loader',
        options: {
          name: 'dist/[path][name].[ext]',
        },
      },
      {
        test: /\.css$/,
        use: ['babel-loader', 'raw-loader', 'postcss-loader'],
      },
      {
        test: /\.styl$/,
        use: [
          // 'babel-loader',
          'raw-loader',
          'postcss-loader',
          {
            loader: 'stylus-loader',
            options: {
              stylusOptions: {
                includePaths: ['styles', 'node_modules']
                  .map((d) => path.join(__dirname, d))
                  .map((g) => glob.sync(g))
                  .reduce((a, c) => a.concat(c), []),
              },
            },
          },
        ],
      }
    );
    return config;
  },
};
