if (typeof define == 'undefined') {
  var nodejs = true,
      expect = require('chai').expect;

  var LocalStorage = require('node-localstorage').LocalStorage;
  global.localStorage = new LocalStorage(__dirname + '/scorm-local-store');

  define = function(deps, callback) {
    deps = deps.map(function(d) { return require('../' + d); });
    callback.apply(this, deps);
  }
}

define(['scorm-local'], function(scormLocal) {

  describe('scorm-local', function() {
    var api = null;

    beforeEach(function setUp() {
      localStorage.clear();
      api = scormLocal('test');
      api.LMSInitialize();
    });

    after(function cleanUp() {
      if (nodejs) localStorage._deleteLocation();
    });

    it('model', function() {
      // default data
      expect(api.LMSGetValue('cmi.core.student_name'))
      .to.equal('Appleseed, John');
      expect(api.LMSGetValue('cmi.core.student_id'))
      .to.equal('770b7a652cee065cbb9759ff1a0d46a927c8ba98');

      // simulate data received from LMS
      var model = {
        'cmi.core.student_name': 'Applejohn, Seed',
        'cmi.core.student_id': 'ed62485f34714020d2e82d8a3bc7e906f714e04b'
      };

      api = scormLocal(null, { model: model });
      api.LMSInitialize();

      Object.keys(model).forEach(function(k) {
        expect(api.LMSGetValue(k)).to.equal(model[k]);
      });
    });

    it('LMSInitialize', function() {
      var api = scormLocal();
      expect(api.LMSInitialize()).to.be.true;
      // already initialized
      expect(api.LMSInitialize()).to.be.false;
    });

    it('LMSFinish', function() {
      expect(api.LMSFinish()).to.be.true;
      // already terminated
      expect(api.LMSFinish()).to.be.false;
    });

    it('LMSGetValue', function() {
      var model = {
        'cmi.core.lesson_location': '',
        'cmi.core.lesson_status': 'not attempted',
        'cmi.core.lesson_mode': 'normal',
        'cmi.suspend_data': ''
      };

      Object.keys(model).forEach(function(key) {
        expect(api.LMSGetValue(key)).to.equal(model[key]);
      });
    });

    it('LMSSetValue', function() {
      var data = {
        'cmi.core.lesson_location': '33',
        'cmi.core.lesson_status': 'incomplete',
        'cmi.suspend_data': 'some-data'
      };

      Object.keys(data).forEach(function(key) {
        expect(api.LMSSetValue(key, data[key])).to.be.true;
        expect(api.LMSGetValue(key)).to.equal(data[key]);
      });
    });

    it('LMSCommit', function(done) {
      // set data, but don't commit
      expect(api.LMSSetValue('cmi.suspend_data', 'data')).to.be.true;
      expect(api.LMSGetValue('cmi.suspend_data')).to.equal('data');

      // initialize API with persistance of 10ms
      api = scormLocal('test', { persistFor: 0.01 });
      api.LMSInitialize();

      // if data wasn't commited, it should return defaults
      expect(api.LMSGetValue('cmi.suspend_data')).to.equal('');

      // set data and commit
      expect(api.LMSSetValue('cmi.suspend_data', 'data')).to.be.true;
      expect(api.LMSGetValue('cmi.suspend_data')).to.equal('data');
      expect(api.LMSCommit()).to.be.true;

      // restart API and check if data persisted
      api = scormLocal('test');
      api.LMSInitialize();
      expect(api.LMSGetValue('cmi.suspend_data')).to.equal('data');

      // check if it didn't persist for more than 10ms
      setTimeout(function() {
        var api = scormLocal('test');
        api.LMSInitialize();
        expect(api.LMSGetValue('cmi.suspend_data')).to.equal('');
        done();
      }, 11);

      // data shouldn't persist when time is 0
      api = scormLocal('another-test', { persistFor: 0 });
      api.LMSInitialize();
      expect(api.LMSSetValue('cmi.suspend_data', 'data')).to.be.true;
      expect(api.LMSGetValue('cmi.suspend_data')).to.equal('data');

      api = scormLocal('another-test');
      api.LMSInitialize();
      expect(api.LMSGetValue('cmi.suspend_data')).to.equal('');
    });

    it('flush', function() {
      // data should be reset, even if persistance is -1
      var api = scormLocal('another-test', { persistFor: -1 });
      api.LMSInitialize();
      expect(api.LMSSetValue('cmi.suspend_data', 'data')).to.be.true;
      expect(api.LMSGetValue('cmi.suspend_data')).to.equal('data');
      expect(api.LMSCommit()).to.be.true;

      expect(localStorage.length).to.equal(1);
      api.flush();
      expect(localStorage.length).to.equal(0);

      api = scormLocal('test');
      api.LMSInitialize();
      expect(api.LMSGetValue('cmi.suspend_data')).to.equal('');
    });

    it('importTo', function() {
      var obj = {};
      api.importTo(obj);

      expect(obj).to.include.keys([
        'LMSInitialize', 'LMSFinish', 'LMSGetValue', 'LMSSetValue',
        'LMSCommit', 'LMSGetLastError', 'LMSGetErrorString', 'LMSGetDiagnostic'
      ]);
    });

  });
});
