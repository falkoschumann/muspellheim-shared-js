# Possible values: e.g. major, minor, patch or new version like `1.2.3`
VERSION?=minor

all: dist docs check

clean:
	rm -rf coverage docs

distclean: clean
	rm -rf dist node_modules

dist: build

release: all
	bun version $(VERSION) -m "chore: create release v%s"
	git push
	git push --tags

publish: all
	bun publish

docs: prepare
	bunx typedoc src/mod.ts

check: test
	bunx eslint .
	bunx prettier --check .

format:
	bunx eslint --fix .
	bunx prettier --write .

dev: prepare
	bun test --watch

test: prepare
	bun test

watch: prepare
	bun test --watch

coverage: prepare
	bun test --coverage

unit-tests: prepare
	bun test unit

integration-tests: prepare
	bun test integration

e2e-tests: prepare
	bun test e2e

build: prepare
	bun run build

prepare: version
	@if [ -n "$(CI)" ] ; then \
		echo "CI detected, run bun ci"; \
		bun ci; \
	else \
		bun install; \
	fi

version:
	@echo "Use bun $(shell bun --version)"

.PHONY: \
	all clean distclean dist \
	release publish docs \
	check format
	dev test watch coverage unit-tests integration-tests e2e-tests \
	build prepare version
