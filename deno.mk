# Possible values: major, minor, patch or concrete version
VERSION = minor

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
	deno publish --dry-run

docs:
# FIXME	deno doc --html --name="Muspellheim Shared" --lint lib
	deno doc --html --name="Muspellheim Shared" lib

check: test
	deno run --allow-all npm:eslint lib test
	deno run --allow-all npm:prettier . --check
# TODO	deno fmt --check
	deno lint

format:
	deno run --allow-all npm:eslint --fix lib test
	deno run --allow-all npm:prettier . --write
# TODO	deno fmt
	deno lint --fix

dev: build
	deno run --allow-all npm:vitest

test: build
	deno run --allow-all npm:vitest run

unit-tests: build
	deno run --allow-all npm:vitest run --testPathPattern=".*\/unit\/.*"

integration-tests: build
	deno run --allow-all npm:vitest run --testPathPattern=".*\/integration\/.*"

e2e-tests: build
	deno run --allow-all npm:vitest run --testPathPattern=".*\/e2e\/.*"

coverage: build
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
