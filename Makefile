all: browserify

deps: package.json
	npm install
browserify: deps *.js
	browserify main.js --debug -o jsRender.v1.js

dist: browserify jsRender.v1.js
	uglifyjs -b ascii_only=true,beautify=false -o jsRender.v1.min.js jsRender.v1.js

debug: browserify jsRender.v1.js
	uglifyjs -b ascii_only=true,beautify=false --source-map jsRender.v1.min.js.map -o jsRender.v1.min.js jsRender.v1.js
