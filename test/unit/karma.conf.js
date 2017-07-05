var webpackConfig = require('../../webpack.config.js')

module.exports = function (config) {
  config.set({
    browsers: ['ChromeHeadless'],
    frameworks: [
      'mocha',
      'sinon-chai',
      'websocket-server'
    ],
    reporters: ['spec', 'coverage'],
    files: ['./index.js'],
    preprocessors: {
      './index.js': ['webpack', 'sourcemap']
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: true
    },
    coverageReporter: {
      dir: './coverage',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' }
      ]
    },
    websocketServer: {
      port: 9090,
      beforeStart: (server) => {
        server.on('request', (req) => {
          console.log(new Date() + ' new websocket request...');
        });
      },
      afterStart: (server) => {
        console.log('Server now listening!');
      }
    },
    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags: [
          '--headless',
          '--disable-gpu',
          // Without a remote debugging port, Google Chrome exits immediately.
          '--remote-debugging-port=9222',
        ],
      }
    }
  })
}
