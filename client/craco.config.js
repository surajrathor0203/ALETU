
module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          stream: require.resolve('stream-browserify'),
          util: require.resolve('util/'),
          crypto: require.resolve('crypto-browserify'),
          path: require.resolve('path-browserify'),
          os: require.resolve('os-browserify/browser'),
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          querystring: require.resolve('querystring-es3'),
          url: require.resolve('url/'),
          buffer: require.resolve('buffer/'),
        }
      }
    }
  }
};