TARGET := iphone:clang:latest:15.0
ARCHS = arm64 arm64e
DEBUG = 0

include $(THEOS)/makefiles/common.mk

APPLICATION_NAME = PeachTube

PeachTube_FILES = main.m AppDelegate.m
PeachTube_FRAMEWORKS = UIKit Foundation WebKit CoreGraphics
PeachTube_RESOURCE_DIRS = Resources
PeachTube_CFLAGS = -fobjc-arc -O2

include $(THEOS_MAKE_PATH)/application.mk
