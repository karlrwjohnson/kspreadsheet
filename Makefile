

NW_INSTALL_ROOT = /opt/nwjs-v0.13.0-alpha5-linux-x64
NW_FLAGS = --no-sandbox

NW_DOWNLOAD_SERVER = dl.nwjs.io
NW_VERSION = v0.13.0-alpha6

NW_PLATFORM = linux-x64
NW_PLATFORM_EXT = tar.gz

NW_SOURCE_URL = http://$(NW_DOWNLOAD_SERVER)/$(NW_VERSION)/nwjs-$(NW_VERSION)-$(NW_PLATFORM).$(NW_PLATFORM_EXT)

.nwjs:
	curl $(NW_SOURCE_URL) | tar xz
	mv nwjs-$(NW_VERSION)-$(NW_PLATFORM) .nwjs



.PHONY: run
run:
	$(NW_INSTALL_ROOT)/nw $(NW_FLAGS) .

