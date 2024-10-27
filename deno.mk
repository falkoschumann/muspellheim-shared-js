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
#	TODO deno fmt --check
	deno lint

format:
	deno fmt
	deno lint --fix

test: prepare
	deno run --allow-all npm:jest

watch: build
	deno test --watch

coverage: build
	deno test --coverage

build: version
	deno install
	deno run --allow-all npm:rollup -c

version:
	@echo "Use Deno $(shell deno --version)"

.PHONY: all clean distclean dist check format \
	test watch coverage \
	build prepare version
