module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'requirejs', 'chai'],

    files: [
      {pattern: 'test/*-spec.js', included: false},
      {pattern: 'scorm-local.js', included: false},
      'test/karma-runner.js'
    ],

    client: {
      mocha: {
        ui: 'bdd'
      }
    }
  });
};
