PM_OPTIONS?=--ignore-scripts
RUN_OPTIONS?=--bun
DEPENDABOT=dependabot[bot]
SHELL:=/bin/bash

all: dist docs check

clean:
	rm -rf coverage docs
	rm -rf node_modules/.tmp

distclean: clean
	rm -rf dist node_modules

dist: build

publish: all
ifdef CI
	bun publish
else
	bun pm pack
endif

docs: prepare
	bunx $(RUN_OPTIONS) typedoc src/lib.ts

check: test
	bunx $(RUN_OPTIONS) eslint .
	bunx $(RUN_OPTIONS) prettier --check .
	bunx $(RUN_OPTIONS) sheriff verify

format:
	bunx $(RUN_OPTIONS) eslint --fix .
	bunx $(RUN_OPTIONS) prettier --write .

test: prepare
	bun run $(RUN_OPTIONS) test

watch: prepare
	bun run $(RUN_OPTIONS) watch

unit-tests: prepare
	bunx $(RUN_OPTIONS) vitest run unit

integration-tests: prepare
	bunx $(RUN_OPTIONS) vitest run integration

e2e-tests: prepare
	bunx $(RUN_OPTIONS) vitest run e2e

build: prepare
	rm -rf dist
	bunx $(RUN_OPTIONS) tsc --build
	bunx $(RUN_OPTIONS) tsc --project tsconfig.build.json
	bun build src/lib.ts --outdir=dist --packages external
	bun build src/lib.ts --outdir=dist --packages external --format cjs --entry-naming "[dir]/[name].cjs"

prepare: version
ifdef CI
ifeq ($(findstring $(DEPENDABOT), $(GITHUB_ACTOR)), $(DEPENDABOT))
	@echo "dependabot detected, run bun install"
	bun install $(PM_OPTIONS)
else
	@echo "CI detected, run bun ci"
	bun ci $(PM_OPTIONS)
endif
else
	bun install $(PM_OPTIONS)
endif

version:
	@echo "Use bun $(shell bun --version)"

.PHONY: \
	all clean distclean dist \
	publish docs \
	check format \
	test watch coverage unit-tests integration-tests e2e-tests \
	build prepare version
