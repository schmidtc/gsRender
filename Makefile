all: browserify

deps: package.json
	npm install
browserify: deps *.js
	browserify main.js --debug -o geoscore.v1.js

dist: browserify geoscore.v1.js
	uglifyjs -b ascii_only=true,beautify=false -o geoscore.v1.min.js geoscore.v1.js

debug: browserify geoscore.v1.js
	uglifyjs -b ascii_only=true,beautify=false --source-map geoscore.v1.min.js.map -o geoscore.v1.min.js geoscore.v1.js
