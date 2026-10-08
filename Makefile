JS?=bun
PM?=bun
RUN?=bunx
SHELL:=/bin/bash
DEPENDENCY_UPDATER=dependabot[bot]

all: dist docs check

clean:
	rm -rf coverage docs
	rm -rf node_modules/.tmp

distclean: clean
	rm -rf dist node_modules

dist: build

publish: all
ifdef CI
	npm publish --access public
else
	$(PM) pm pack
endif

docs: prepare
	$(RUN) typedoc src/lib.ts

check: test
	$(RUN) eslint .
	$(RUN) prettier --check .
	$(RUN) sheriff verify

fix:
	$(RUN) eslint --fix .
	$(RUN) prettier --write .

test: prepare
	$(PM) run test

watch: prepare
	$(PM) run watch

unit-tests: prepare
	$(RUN) vitest run unit

integration-tests: prepare
	$(RUN) vitest run integration

e2e-tests: prepare
	$(RUN) vitest run e2e

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
	@echo "Using runtime $(JS) version $(shell $(JS) --version)"
	@echo "Using package manager $(PM) version $(shell $(PM) --version)"
	@echo "Using package runner $(RUN) version $(shell $(RUN) --version)"

.PHONY: \
	all clean distclean dist \
	publish docs \
	check fix \
	test watch coverage unit-tests integration-tests e2e-tests \
	build prepare version
