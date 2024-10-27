# TODO remove --experimental-global-customevent when Node.js 18 must not be supported anymore
export NODE_OPTIONS=--experimental-global-customevent

all: test

clean:
	rm -rf coverage

distclean: clean
	rm -rf dist
	rm -rf node_modules

test: prepare
	npx jest

unit-tests: prepare
	npx jest --testPathPattern=".*\/unit\/.*"

integration-tests:
	npx jest --testPathPattern=".*\/integration\/.*"

e2e-tests: prepare
	npx jest --testPathPattern=".*\/e2e\/.*"

watch: prepare
	npx jest --watch

coverage: prepare
	npx jest --coverage

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

.PHONY: all clean distclean \
	test unit-tests integration-tests e2e-tests watch coverage \
	prepare version
