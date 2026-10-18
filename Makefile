# JavaScript configuration
JS := bun
PM := bun
RUN := bunx

# Make configuration
SHELL := /bin/bash

# Update configuration
DEPENDENCY_UPDATER=dependabot[bot]

all: dist docs check

clean:
	rm -rf coverage
	rm -rf node_modules/.cache

distclean: clean
	rm -rf dist docs
	rm -rf node_modules

dist: build

publish: all
ifdef CI
	npm publish --access public
else
	$(PM) pm pack
endif

docs: prepare
	$(RUN) typedoc src/lib.ts

check: coverage
	$(PM) run lint
	$(PM) run check-types
	$(PM) run format

fix:
	$(PM) run lint:fix
	$(PM) run format:fix

test: prepare
	$(PM) run test

coverage: prepare
	$(PM) run test:coverage

watch: prepare
	$(PM) run test:watch

build: prepare
	rm -rf dist
	$(RUN) tsc
	$(RUN) tsc --project tsconfig.build.json
	$(PM) build src/lib.ts --production --outdir=dist --sourcemap=linked --packages=external
	$(PM) build src/lib.ts --production --outdir=dist --sourcemap=linked --packages=external --format=cjs --entry-naming="[dir]/[name].cjs"

prepare: version
ifdef CI
ifeq ($(findstring $(DEPENDENCY_UPDATER), $(GITHUB_ACTOR)), $(DEPENDENCY_UPDATER))
	@echo "dependency updater detected, run $(PM) install"
	$(PM) install
else
	@echo "CI detected, run $(PM) ci"
	$(PM) ci
endif
else
	$(PM) install
endif

version:
	@echo "Use runtime $(JS) version $(shell $(JS) --version)"
	@echo "Use package manager $(PM) version $(shell $(PM) --version)"
	@echo "Use package runner $(RUN) version $(shell $(RUN) --version)"

.PHONY: \
	all clean distclean dist \
	publish docs \
	check fix \
	test coverage watch \
	build prepare version
