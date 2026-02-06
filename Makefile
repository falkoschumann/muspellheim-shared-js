# Possible values: e.g. major, minor, patch or new version like `1.2.3`
VERSION?=minor

RUNTIME?=bun
PACKAGE_MANAGER?=bun
RUNNER?=bunx

all: dist docs check

clean:
	rm -rf coverage docs

distclean: clean
	rm -rf dist node_modules

dist: build

release: all
	$(PACKAGE_MANAGER) version $(VERSION) -m "chore: create release v%s"
	git push
	git push --tags

publish: all
	$(PACKAGE_MANAGER) publish

docs: prepare
	$(RUNNER) typedoc src/mod.ts

check: test
	$(RUNNER) eslint .
	$(RUNNER) prettier --check .
# TODO Configure sheriff

format:
	$(RUNNER) eslint --fix .
	$(RUNNER) prettier --write .

dev: prepare
	$(RUNNER) vitest

test: prepare
	$(RUNNER) vitest run

watch: prepare
	$(PACKAGE_MANAGER) test

coverage: prepare
	$(RUNNER) vitest run --coverage

unit-tests: prepare
	$(RUNNER) vitest run unit

integration-tests: prepare
	$(RUNNER) vitest run integration

e2e-tests: prepare
	$(RUNNER) vitest run e2e

build: prepare
	$(PACKAGE_MANAGER) run build

prepare: version
	@if [ -n "$(CI)" ] ; then \
		echo "CI detected, run $(PACKAGE_MANAGER) ci"; \
		$(PACKAGE_MANAGER) ci; \
	else \
		$(PACKAGE_MANAGER) install; \
	fi

version:
	@echo "Use runtime $(RUNTIME) $(shell $(RUNTIME) --version)"
	@echo "Use package manager $(PACKAGE_MANAGER) $(shell $(PACKAGE_MANAGER) --version)"

.PHONY: \
	all clean distclean dist \
	release publish docs \
	check format
	dev test watch coverage unit-tests integration-tests e2e-tests \
	build prepare version
