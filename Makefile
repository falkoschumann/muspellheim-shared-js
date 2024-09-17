# TODO remove --experimental-global-customevent when Node.js 18 must not be supported anymore
# TODO remove --experimental-vm-modules when Jest supports ESM
export NODE_OPTIONS=--experimental-global-customevent --experimental-vm-modules
export NPM_CONFIG_YES=true

all: dist check

clean:
	rm -rf coverage

distclean: clean
	rm -rf node_modules

dist: build

check: test
	npx prettier . --check
	npx eslint src test

format:
	npx prettier . --write
	npx eslint --fix src test

test: prepare
	npm test

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

.PHONY: all clean distclean dist check format \
	test unit-tests integration-tests e2e-tests watch coverage \
	build prepare version
