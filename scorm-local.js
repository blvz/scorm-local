(function (global, factory) {
  switch(false) {
    // CommonJS
    case !(typeof module != 'undefined' && module.exports != null):
      module.exports = factory();
      break;

    // AMD
    case !(typeof define == 'function' && define.amd):
      define([], factory);
      break;

    // whatever
    default:
      global.scormLocal = factory();
  }
}(this, function() {

  // default options
  var defaultOpts = {
    persistFor: 60,
    model: null
  },

  // SCORM 1.2 error codes
  errorCodes = {
    0:   'No error.',
    101: 'General Exception.',
    201: 'Invalid argument error.',
    202: 'Element cannot have children.',
    203: 'Element not an array. Cannot have count.',
    301: 'Not initialized.',
    401: 'Not implemented error',
    402: 'Invalid set value, element is a keyword',
    403: 'Element is read only.',
    404: 'Element is write only.',
    405: 'Incorrect Data Type.'
  },

  // a default sample of a SCORM 1.2 data model
  defaultModel = {
    'cmi.core._children': ['student_id', 'student_name', 'lesson_location', 'credit', 'lesson_status', 'entry', 'score', 'total_time', 'lesson_mode', 'exit', 'session_time'],
    'cmi.core.student_id': '770b7a652cee065cbb9759ff1a0d46a927c8ba98',
    'cmi.core.student_name': 'Appleseed, John',
    'cmi.core.lesson_location': '',
    'cmi.core.credit': 'credit',
    'cmi.core.lesson_status': 'not attempted',
    'cmi.core.entry': 'ab-initio',
    'cmi.core.score_children': ['raw', 'min', 'max'],
    // TODO: limit score.raw to 100 and check its initial value
    'cmi.core.score.raw': null,
    'cmi.core.score.max': null,
    'cmi.core.score.min': null,
    // TODO: compute total_time, when setting session_time
    'cmi.core.total_time': '0000:00:00.00',
    'cmi.core.lesson_mode': 'normal',
    'cmi.core.exit': '',
    'cmi.core.session_time': '00:00:00',
    // TODO: limit suspend_data to 4096 chars
    'cmi.suspend_data': '',
    'cmi.launch_data': '',
    // TODO: limit comments to 4096 chars
    'cmi.comments': '',
    'cmi.comments_from_lms': '',
    'cmi.objectives._children': ['id', 'score', 'status'],
    'cmi.objectives._count': 0,
    'cmi.student_data._children': ['mastery_score', 'max_time_allowed', 'time_limit_action'],
    // TODO: check student_data initial values
    'cmi.student_data.mastery_score': null,
    'cmi.student_data.max_time_allowed': null,
    'cmi.student_data.time_limit_action': 'continue,no message',
    'cmi.student_preference._children': ['audio', 'language', 'speed', 'text'],
    'cmi.student_preference.audio': null,
    'cmi.student_preference.language': null,
    'cmi.student_preference.speed': null,
    'cmi.student_preference.text': null,
    'cmi.interactions._children': ['id', 'objectives', 'time', 'type', 'correct_responses', 'weighting', 'student_response', 'result', 'latency'],
    'cmi.interactions._count': 0
    // TODO: correct count, after adding interactions
  };

  // returns current time with, optionally, seconds added.
  function time(s) {
    return (new Date()).getTime() + ((s || 0) * 1000);
  }

  // returns [a shallow copy of] a, including b, without overwriting.
  function incl(a, b) {
    var c = {};
        a = a || {};
        b = b || {};

    Object.keys(b).forEach(function(k) {
      c[k] = typeof a[k] == 'undefined' ? b[k] : a[k];
    });
    return c;
  }

  // returns function to create API instances, for different SCOs
  return function(sco, opts) {
    opts = incl(opts, defaultOpts);

    var initialized = false,
        lastError   = 0,
        model       = incl(opts.model, defaultModel),
        data        = store();

    // get/set non-default data in localStorage
    function store(value) {
      var k = 'scorm-local-' + (sco || 'default'),
          r = null;

      if (typeof value == 'undefined') {
        try {
          r = JSON.parse(localStorage.getItem(k));
        } finally {}

        if ({}.toString.call(r) != '[object Object]' || r._flush ||
            r._expireTime === 0) return {};

        if (r._expireTime !== -1 &&
            time() >= (r._expireTime || Number.POSITIVE_INIFINITY)) return {};

        return r;
      } else if (value === false) {
        return localStorage.removeItem(k);
      }

      //  0 always expire
      // -1 never expire
      // or time to expire
      value._expireTime = (function() {
        switch(true) {
        case (opts.persistFor > 0):
          return time(opts.persistFor) + 1;
        case (opts.persistFor < 0):
          return -1;
        default:
          return 0;
      }})();

      localStorage.setItem(k, JSON.stringify(value));
      return value;
    }

    return {
      // imports the API methods to another object
      importTo: function(obj) {
        for (var k in this) if (/^LMS/.test(k)) obj[k] = this[k].bind(this);
      },

      // removes data from localStorage and mark it as flushed
      // in case it's commited after flushing
      flush: function() {
        data = {_flush: true};
        store(false);
      },

      // TODO: check if return booleans should be strings
      LMSInitialize: function() {
        if (initialized) return lastError = 101, false;

        lastError = 0;
        initialized = true;
        return true;
      },

      // TODO: check if return booleans should be strings
      LMSFinish: function() {
        if (!initialized) return lastError = 301, false;

        lastError = 0;
        initialized = false;
        return true;
      },

      // TODO: check if return booleans should be strings
      // TODO: validate arguments
      LMSGetValue: function(key) {
        if (!initialized) return lastError = 301, false;

        var v = data[key] || model[key];
        if (typeof v == 'undefined') return lastError = 201, null;

        lastError = 0;
        return v;
      },

      // TODO: check if return booleans should be strings
      // TODO: validate arguments
      LMSSetValue: function(key, value) {
        if (!initialized) return lastError = 301, false;
        if (typeof model[key] == 'undefined') return lastError = 201, false;

        data[key] = value;
        lastError = 0;
        return true;
      },

      // TODO: check if return booleans should be strings
      LMSCommit: function() {
        if (!initialized) return lastError = 301, false;

        store(data);
        lastError = 0;
        return true;
      },

      LMSGetLastError: function() {
        return lastError;
      },

      LMSGetErrorString: function(code) {
        return errorCodes[code];
      },

      // TODO: improve diagnostics
      LMSGetDiagnostic: function(code) {
        return errorCodes[code];
      }
    };
  };
}));
