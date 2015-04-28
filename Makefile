UGLIFY=./node_modules/uglify-js/bin/uglifyjs
MOCHA=./node_modules/mocha/bin/mocha
KARMA=./node_modules/karma/bin/karma

default: scorm-local.min.js test

scorm-local.min.js: scorm-local.js
	@ $(UGLIFY) scorm-local.js -o scorm-local.min.js

test:
	@ $(MOCHA) -u tdd --reporter dot test/*spec.js

karma:
	@ $(KARMA) start

.PHONY: test karma
