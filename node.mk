# TODO remove --experimental-global-customevent when Node.js 18 must not be supported anymore
export NODE_OPTIONS=--experimental-global-customevent

all: test

clean:
	rm -rf coverage

distclean: clean
	rm -rf dist
	rm -rf node_modules

dev: prepare
	npx vitest

test: prepare
	npx vitest run

unit-tests: prepare
	npx vitest run --testPathPattern=".*\/unit\/.*"

integration-tests:
	npx vitest run --testPathPattern=".*\/integration\/.*"

e2e-tests: prepare
	npx vitest run --testPathPattern=".*\/e2e\/.*"

coverage: prepare
	npx vitest --coverage

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
