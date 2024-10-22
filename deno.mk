export NPM_CONFIG_YES=true

all: dist check docs

clean:
	rm -rf coverage
	rm -rf docs

distclean: clean
	rm -rf dist
	rm -rf node_modules

dist: build

docs: build
# 	FIXME deno doc --html --name="Muspellheim Shared" --lint lib
	deno doc --html --name="Muspellheim Shared" lib

check: test
	deno run --allow-env --allow-read --allow-sys --allow-write npm:prettier . --check
	deno run --allow-env --allow-read --allow-write npm:eslint lib test
#	FIXME deno fmt --check --ignore=coverage,dist,docs --single-quote
#	FIXME deno lint --ignore=coverage,dist,docs

format:
	deno fmt --ignore=coverage,dist,docs --single-quote
	deno lint --fix --ignore=coverage,dist,docs

test: prepare
	deno task test
#	deno test

watch: build
	deno test --watch

coverage: build
	deno test --coverage

build: version
	deno install
	deno run --allow-env --allow-ffi --allow-read --allow-write --allow-sys npm:rollup -c

version:
	@echo "Use Deno $(shell deno --version)"

.PHONY: all clean distclean dist check format \
	test watch coverage \
	build prepare version
