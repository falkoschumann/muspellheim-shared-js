# Possible values: major, minor, patch or concrete version
VERSION = minor

# TODO remove --experimental-global-customevent when Node.js 18 must not be supported anymore
export NODE_OPTIONS=--experimental-global-customevent

all: dist docs check

clean:
	rm -rf coverage docs

distclean: clean
	rm -rf dist
	rm -rf node_modules

dist: build

release: all
	npm version $(VERSION) -m "chore: create release v%s"
	git push
	git push --tags

publish: all
	npm publish --access public

docs:
	npx jsdoc lib -c jsdoc.config.json

check: test
	npx eslint lib test
	npx prettier . --check

format:
	npx eslint --fix lib test
	npx prettier . --write

dev: build
	npx vitest

test: build
	npx vitest run

unit-tests: build
	npx vitest run --testPathPattern=".*\/unit\/.*"

integration-tests: build
	npx vitest run --testPathPattern=".*\/integration\/.*"

e2e-tests: build
	npx vitest run --testPathPattern=".*\/e2e\/.*"

coverage: build
	npx vitest --coverage

build: prepare

prepare: version
	@if [ -n "$(CI)" ] ; then \
		echo "CI detected, run npm ci"; \
		npm ci; \
	else \
		npm install; \
	fi

version:
	@echo "Use Node.js $(shell node --version)"
	@echo "Use NPM $(shell npm --version)"

.PHONY: all clean distclean dist release publish docs \
	check format
	dev test unit-tests integration-tests e2e-tests watch coverage \
	build prepare version
