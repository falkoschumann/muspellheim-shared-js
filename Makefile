JS?=bun
PM?=bun
PM_OPTIONS?=--ignore-scripts
RUN?=bunx
RUN_OPTIONS?=--bun
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
	$(PM) publish
else
	$(PM) pm pack
endif

docs: prepare
	$(RUN) $(RUN_OPTIONS) typedoc src/lib.ts

check: test
	$(RUN) $(RUN_OPTIONS) eslint .
	$(RUN) $(RUN_OPTIONS) prettier --check .
	$(RUN) $(RUN_OPTIONS) sheriff verify

format:
	$(RUN) $(RUN_OPTIONS) eslint --fix .
	$(RUN) $(RUN_OPTIONS) prettier --write .

test: prepare
	$(PM) run $(RUN_OPTIONS) test

watch: prepare
	$(PM) run $(RUN_OPTIONS) watch

unit-tests: prepare
	$(RUN) $(RUN_OPTIONS) vitest run unit

integration-tests: prepare
	$(RUN) $(RUN_OPTIONS) vitest run integration

e2e-tests: prepare
	$(RUN) $(RUN_OPTIONS) vitest run e2e

build: prepare
	rm -rf dist
	$(RUN) $(RUN_OPTIONS) tsc --build
	$(RUN) $(RUN_OPTIONS) tsc --project tsconfig.build.json
	$(PM) build src/lib.ts --production --outdir=dist --packages external
	$(PM) build src/lib.ts --production --outdir=dist --packages external --format cjs --entry-naming "[dir]/[name].cjs"

prepare: version
ifdef CI
ifeq ($(findstring $(DEPENDENCY_UPDATER), $(GITLAB_USER_LOGIN)), $(DEPENDENCY_UPDATER))
	@echo "dependency updater detected, run $(PM) install"
	$(PM) install $(PM_OPTIONS)
else
	@echo "CI detected, run $(PM) ci"
	$(PM) ci $(PM_OPTIONS)
endif
else
	$(PM) install $(PM_OPTIONS)
endif

version:
	@echo "Using runtime $(JS) version $(shell $(JS) --version)"
	@echo "Using package manager $(PM) version $(shell $(PM) --version)"
	@echo "Using package runner $(RUN) version $(shell $(RUN) --version)"

.PHONY: \
	all clean distclean dist \
	publish docs \
	check format \
	test watch coverage unit-tests integration-tests e2e-tests \
	build prepare version
