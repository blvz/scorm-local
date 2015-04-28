# scorm-local

SCORM API to test SCOs with localStorage. Not compliant yet.

## Usage

__scormLocal([scoId, options])__

Returns an API object, containing all SCORM 1.2 methods:
`LMSInitialize`, `LMSFinish`, `LMSGetValue`, `LMSSetValue`, `LMSCommit`,
`LMSGetLastError`, `LMSGetErrorString` and `LMSGetDiagnostic`.

```javascript
// this is the default scoId
var scoId = 'default';

// and these are the default options
var options = {
  // expire after 60 seconds from last commit.
  persistFor: 60,
  // persistFor: -1 - never expire.
  // persistFor:  0 - always expire.

  // an object with initial elements.
  model: null
};

// removes data from localStorage and mark it as flushed
api.flush();
```

## Examples

```javascript
var api, scormLocal = require('scorm-local');

// creating an API for the SCO 'some-sco'
api = scormLocal('some-sco');
api.LMSInitialize(''); // #=> true
api.LMSGetValue('cmi.core.score.raw'); // #=> null
api.LMSSetValue('cmi.core.score.raw', 100); // #=> true
api.LMSGetValue('cmi.core.score.raw'); // #=> 100
api.LMSGetValue('cmi.comments_from_lms'); // #=> ''

api = scormLocal('another-sco', {
  persistFor: 2,
  model: {
    'cmi.comments_from_lms': 'Changed initial model data.'
  }
});
api.LMSInitialize('');
api.LMSGetValue('cmi.core.score.raw'); // #=> null
api.LMSSetValue('cmi.core.score.raw', 50); // #=> true
api.LMSGetValue('cmi.core.score.raw'); // #=> 50
api.LMSGetValue('cmi.comments_from_lms'); // #=> 'Changed initial model data.'
api.LMSCommit(''); // #=> true

setTimeout(function() {
  var api = scormLocal('another-sco');
  api.LMSInitialize('');
  // data persists for 2 seconds after last commit
  api.LMSGetValue('cmi.core.score.raw'); // #=> 50
}, 1000);

setTimeout(function() {
  var api = scormLocal('another-sco');
  api.LMSInitialize('');
  // but didn't persist after 2.001 seconds
  api.LMSGetValue('cmi.core.score.raw'); // #=> null
}, 2001);

api = scormLocal('that-sco');
api.LMSInitialize('');
api.LMSSetValue('cmi.core.score.raw', 33); // #=> true
api.LMSGetValue('cmi.core.score.raw'); // #=> 33

// flushing data removes it from localStorage and mark it as flushed
api.flush();
api.LMSGetValue('cmi.core.score.raw'); // #=> null

// by marking it as flushed, it can be reset on next initialization
// (in case it's committed after flushing, like on `window.onunload`)
window.onunload = function() {
  api.LMSSetValue('cmi.core.score.raw', 33); // #=> true
  api.LMSGetValue('cmi.core.score.raw'); // #=> 33
  api.LMSCommit(''); // #=> true
  api.LMSFinish(''); // #=> true
  // data was committed, but it's marked as flushed.
  // on next initialization 'cmi.core.score.raw' will be null
};

// import all LMS API methods to the `window` global
api.importTo(window);
LMSSetValue('cmi.core.score.raw', 3.33);
LMSGetValue('cmi.core.score.raw'); // #=> 3.33
```

You can also use it with AMD:

```javascript
define(['scorm-local'], function(scormLocal) {
  var api = scormLocal('my-sco');
});
```

Or just including it:

```html
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>SCORM Local</title>
</head>

<body id="home">
  <script src="js/scorm-local.min.js"></script>
  <script>
    var api = scormLocal('my-sco');
  </script>
</body>
</html>
```

## License

MIT
