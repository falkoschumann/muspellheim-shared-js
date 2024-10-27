all: dist check docs

clean:
	rm -rf coverage
	rm -rf docs

distclean: clean
	rm -rf dist
	rm -rf node_modules

dist: build

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
	deno run --allow-all npm:jest --watch

test: prepare
	deno run --allow-all npm:jest

unit-tests: prepare
	deno run --allow-all npm:jest --testPathPattern=".*\/unit\/.*"

integration-tests:
	deno run --allow-all npm:jest --testPathPattern=".*\/integration\/.*"

e2e-tests: prepare
	deno run --allow-all npm:jest --testPathPattern=".*\/e2e\/.*"

coverage: prepare
	deno run --allow-all npm:jest --coverage

build: prepare
	deno run --allow-all npm:rollup -c

prepare: version
	deno install

version:
	@echo "Use Deno $(shell deno --version)"

.PHONY: all clean distclean dist docs check format \
	test unit-tests integration-tests e2e-tests watch coverage \
	build prepare version
