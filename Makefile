


NW_PLATFORM = linux-x64
NW_PLATFORM_EXT = tar.gz
NODE_PLATFORM = linux-x64
NODE_PLATFORM_EXT = tar.gz

# (From https://github.com/nwjs/nw.js/wiki/Build-Flavors)
# Since 0.12.0, NW.js supports multiple build flavors, such as Mac App Store
# (MAS), Native Client (NaCl), SDK and normal builds.
#NW_FLAVOR =
NW_FLAVOR = sdk-
#NW_FLAVOR = nacl-

NW_DOWNLOAD_SERVER = http://dl.nwjs.io
NW_VERSION = v0.13.0-alpha7
NW_SOURCE_URL = $(NW_DOWNLOAD_SERVER)/$(NW_VERSION)/nwjs-$(NW_FLAVOR)$(NW_VERSION)-$(NW_PLATFORM).$(NW_PLATFORM_EXT)

NODE_DOWNLOAD_SERVER = https://nodejs.org/dist/
NODE_VERSION = v5.2.0p
NODE_SOURCE_URL = $(NODE_DOWNLOAD_SERVER)/$(NODE_VERSION)/node-$(NODE_VERSION)-$(NODE_PLATFORM).$(NODE_PLATFORM_EXT)

#NW_FLAGS = --no-sandbox
NW_FLAGS =
NODE_FLAGS = --es_staging


### Third-party dependencies

# NW, formerly known as node-webkit
.nwjs:
	curl $(NW_SOURCE_URL) | tar xz
	mv nwjs-$(NW_FLAVOR)$(NW_VERSION)-$(NW_PLATFORM) .nwjs

# NodeJS
.node:
	curl $(NODE_SOURCE_URL) | tar xz
	mv node-$(NODE_VERSION)-$(NODE_PLATFORM) .node

# NPM module: Jasmine (unit testing)
node_modules: .node package.json
	.node/bin/npm update


.PHONY: run
run: .nwjs
	.nwjs/nw $(NW_FLAGS) .

.PHONY: run-nw-only
run-nw-only: .nwjs
	.nwjs/nw $(NW_FLAGS)

.PHONY: test
test: .node node_modules
	.node/bin/node $(NODE_FLAGS) init-jasmine.js

