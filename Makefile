# Possible values: major, minor, patch or concrete version
VERSION = minor

all: dist check docs

clean:
	rm -rf coverage
	rm -rf docs

distclean: clean
	rm -rf dist
	rm -rf node_modules

dist: build

release: dist check docs
	npm version $(VERSION) -m "chore: create release v%s"
	git push
	git push --tags

publish: dist check
#	deno publish --dry-run
	npm publish --access public

docs:
#	FIXME deno doc --html --name="Muspellheim Shared" --lint lib
	deno doc --html --name="Muspellheim Shared" lib
	npx jsdoc lib -c jsdoc.config.json

check: test
	deno fmt --check
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

prepare: version
	deno install

version:
	@echo "Use Deno $(shell deno --version)"

.PHONY: all clean distclean dist release publish docs \
	check format \
	dev test unit-tests integration-tests e2e-tests coverage \
	build prepare version
