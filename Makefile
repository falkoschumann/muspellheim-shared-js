# Possible values: e.g. major, minor, patch or new version like `1.2.3`
VERSION?=minor

all: dist docs check

clean:
	rm -rf coverage docs

distclean: clean
	rm -rf dist node_modules

dist: build

release: all
	npm version $(VERSION) -m "chore: create release v%s"
	git push
	git push --tags

publish: all
	npm publish --access public

docs:
	npx typedoc src/mod.ts

check: test
	npx eslint .
	npx prettier --check .

format:
	npx eslint --fix .
	npx prettier --write .

dev: build
	npx vitest

test: build
	npx vitest run

watch: prepare
	npm test

coverage: prepare
	npx vitest run --coverage

unit-tests: prepare
	npx vitest run unit

integration-tests: prepare
	npx vitest run integration

e2e-tests: prepare
	npx vitest run e2e

build: prepare
	npm run build

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

.PHONY: \
	all clean distclean dist \
	release publish docs \
	check format
	dev test watch coverage unit-tests integration-tests e2e-tests \
	build prepare version
