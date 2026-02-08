all: dist docs check

clean:
	rm -rf coverage docs

distclean: clean
	rm -rf dist node_modules

dist: build

publish: all
	if [ -z "$(CI)" ] ; then \
		bun pm pack; \
	else \
		bun publish; \
	fi

docs: prepare
	bunx --bun typedoc src/mod.ts

check: test
	bunx --bun eslint .
	bunx --bun prettier --check .
	bunx --bun sheriff verify

format:
	bunx --bun eslint --fix .
	bunx --bun prettier --write .

dev: prepare
	bunx --bun vitest --watch

test: prepare
	bunx --bun vitest run

watch: prepare
	bunx --bun vitest watch

coverage: prepare
	bunx --bun vitest run --coverage

unit-tests: prepare
	bunx --bun vitest run unit

integration-tests: prepare
	bunx --bun vitest run integration

e2e-tests: prepare
	bunx --bun vitest run e2e

build: prepare
	rm -rf dist
	bun run build
	bun run build --format cjs --entry-naming "[dir]/[name].cjs"

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
