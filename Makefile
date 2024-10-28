# Possible values: major, minor, patch
VERSION_STEP = minor

all: dist check docs

clean:
	rm -rf coverage
	rm -rf docs

distclean: clean
	rm -rf dist
	rm -rf node_modules

dist: build

release: dist
	npm version $(VERSION_STEP)
	git push

publish:
	deno publish --dry-run

docs:
#	FIXME deno doc --html --name="Muspellheim Shared" --lint lib
	deno doc --html --name="Muspellheim Shared" lib
	npx jsdoc lib -c jsdoc.config.json

check: test
#	TODO deno fmt --check
	deno lint

format:
	deno fmt
	deno lint --fix

dev: prepare
	deno run --allow-all npm:vitest

test: prepare
	deno run --allow-all npm:vitest run

unit-tests: prepare
	deno run --allow-all npm:vitest run --testPathPattern=".*\/unit\/.*"

integration-tests:
	deno run --allow-all npm:vitest run --testPathPattern=".*\/integration\/.*"

e2e-tests: prepare
	deno run --allow-all npm:vitest run --testPathPattern=".*\/e2e\/.*"

coverage: prepare
	deno run --allow-all npm:vitest run --coverage

build: prepare
	deno run --allow-all npm:rollup -c

prepare: version
	deno install

version:
	@echo "Use Deno $(shell deno --version)"

.PHONY: all clean distclean dist docs check format \
	test unit-tests integration-tests e2e-tests watch coverage \
	build prepare version
