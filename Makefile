all: browserify

deps: package.json
	npm install
browserify: deps *.js
	browserify main.js --debug -o gsRender.v1.js

dist: browserify gsRender.v1.js
	uglifyjs -b ascii_only=true,beautify=false -o gsRender.v1.min.js gsRender.v1.js

debug: browserify gsRender.v1.js
	uglifyjs -b ascii_only=true,beautify=false --source-map gsRender.v1.min.js.map -o gsRender.v1.min.js gsRender.v1.js
