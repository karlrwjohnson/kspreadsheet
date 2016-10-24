# Makefile for KSpreadsheet


#NW_FLAGS = --no-sandbox
NW_FLAGS =
NODE_FLAGS = --es_staging

SELENIUM_VERSION         = 2.48.2
SELENIUM_DOWNLOAD_SERVER = http://selenium-release.storage.googleapis.com
SELENIUM_FILENAME        = selenium-server-standalone-$(SELENIUM_VERSION).jar
SELENIUM_SOURCE_URL      = $(SELENIUM_DOWNLOAD_SERVER)/$(basename $(SELENIUM_VERSION))/$(SELENIUM_FILENAME)

### Third-party dependencies

chromedriver:
ifeq ($(OS), Windows_NT)
	$(DOWNLOAD) $(NW_DRIVER_SOURCE_URL) $(NW_DRIVER_BASENAME).$(NW_PLATFORM_EXT)
	$(UNZIP) $(NW_DRIVER_BASENAME).$(NW_PLATFORM_EXT)\$(NW_DRIVER_BASENAME)\chromedriver.exe chromedriver.exe
	del $(NW_DRIVER_BASENAME).$(NW_PLATFORM_EXT)
else
	curl $(NW_DRIVER_SOURCE_URL) | tar xz --wildcards --to-stdout */chromedriver > chromedriver
endif

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
	node/bin/node $(NODE_FLAGS) unit-test.js

.PHONY: uitest
uitest: node nwjs chromedriver node_modules
	node/bin/node $(NODE_FLAGS) ui-test.js

.PHONY: clean
clean:
	rm -rvf node nwjs chromedriver node_modules selenium-server-standalone-*.jar

.PHONY: run-selenium
run-selenium:
	java -jar selenium-server-standalone-2.48.2.jar -Dwebdriver.chrome.driver=./chromedriver

