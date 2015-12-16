# Makefile for KSpreadsheet

NW_PLATFORM       = linux-x64
NW_PLATFORM_EXT   = tar.gz
NODE_PLATFORM     = linux-x64
NODE_PLATFORM_EXT = tar.gz

# (From https://github.com/nwjs/nw.js/wiki/Build-Flavors)
# Since 0.12.0, NW.js supports multiple build flavors, such as Mac App Store
# (MAS), Native Client (NaCl), SDK and normal builds.
#NW_FLAVOR =
NW_FLAVOR = sdk-
#NW_FLAVOR = nacl-

#NW_FLAGS = --no-sandbox
NW_FLAGS =
NODE_FLAGS = --es_staging

NODE_VERSION         = v5.2.0
NODE_DOWNLOAD_SERVER = https://nodejs.org/dist
NODE_BASENAME        = node-$(NODE_VERSION)-$(NODE_PLATFORM)
NODE_SOURCE_URL      = $(NODE_DOWNLOAD_SERVER)/$(NODE_VERSION)/$(NODE_BASENAME).$(NODE_PLATFORM_EXT)

NW_VERSION           = v0.13.0-alpha7
NW_DOWNLOAD_SERVER   = http://dl.nwjs.io
NW_BASENAME          = nwjs-$(NW_FLAVOR)$(NW_VERSION)-$(NW_PLATFORM)
NW_DRIVER_BASENAME   = chromedriver-nw-$(NW_VERSION)-$(NW_PLATFORM)
NW_SOURCE_URL        = $(NW_DOWNLOAD_SERVER)/$(NW_VERSION)/$(NW_BASENAME).$(NW_PLATFORM_EXT)
NW_DRIVER_SOURCE_URL = $(NW_DOWNLOAD_SERVER)/$(NW_VERSION)/$(NW_DRIVER_BASENAME).$(NW_PLATFORM_EXT)

SELENIUM_VERSION         = 2.48.2
SELENIUM_DOWNLOAD_SERVER = http://selenium-release.storage.googleapis.com
SELENIUM_FILENAME        = selenium-server-standalone-$(SELENIUM_VERSION).jar
SELENIUM_SOURCE_URL      = $(SELENIUM_DOWNLOAD_SERVER)/$(basename $(SELENIUM_VERSION))/$(SELENIUM_FILENAME)

### Third-party dependencies

# NodeJS
node:
	curl $(NODE_SOURCE_URL) | tar xz
	mv $(NODE_BASENAME) node

# NW, formerly known as node-webkit
nwjs:
	curl $(NW_SOURCE_URL) | tar xz
	mv $(NW_BASENAME) nwjs

chromedriver:
	curl $(NW_DRIVER_SOURCE_URL) | tar xz --wildcards --to-stdout */chromedriver > chromedriver

# NPM module: Jasmine (unit testing)
node_modules: node package.json
	node/bin/npm update

# Selenium: UI testing
$(SELENIUM_FILENAME):
	curl $(SELENIUM_SOURCE_URL) > $(SELENIUM_FILENAME)

third-party-deps: node nwjs chromedriver node_modules $(SELENIUM_FILENAME)

### Running

.PHONY: run
run: nwjs
	nwjs/nw $(NW_FLAGS) .

.PHONY: test
test: unittest

.PHONY: unittest
unittest: node node_modules
	node/bin/node $(NODE_FLAGS) init-jasmine.js

.PHONY: clean
clean:
	rm -rvf node nwjs chromedriver node_modules selenium-server-standalone-*.jar

run-selenium:
	java -jar selenium-server-standalone-2.48.2.jar -Dwebdriver.chrome.driver=./chromedriver

