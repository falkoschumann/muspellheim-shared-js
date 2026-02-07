# Possible values: e.g. major, minor, patch or new version like `1.2.3`
VERSION?=minor

all: dist docs check

clean:
	rm -rf docs

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
	bunx sheriff verify

format:
	bunx eslint --fix .
	bunx prettier --write .

dev: prepare
	vitest --watch

test: prepare
	vitest run

watch: prepare
	vitest watch

coverage: prepare
	vitest run --coverage

unit-tests: prepare
	vitest run unit

integration-tests: prepare
	vitest run integration

e2e-tests: prepare
	vitest run e2e

build: prepare
	rm -rf dist
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
