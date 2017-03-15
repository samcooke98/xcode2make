
# Path to toolchain
COMPILER = $(THEOS)/toolchain/linux/iphone/bin/armv7-apple-darwin11-clang $(BASIC_COMPILER_FLAGS)

CC_COMPILER = $(THEOS)/toolchain/linux/iphone/bin/armv7-apple-darwin11-clang $(BASIC_COMPILER_FLAGS)
CXX_COMPILER = $(THEOS)/toolchain/linux/iphone/bin/armv7-apple-darwin11-clang++ $(BASIC_COMPILER_FLAGS) 


LINKER = $(THEOS)/toolchain/linux/iphone/bin/armv7-apple-darwin11-libtool




#Output directory
OUTPUT_DIR = ./build

INTERMEDIATE_DIR = $(OUTPUT_DIR)/intermediate/
INCLUDE_BUILD_HEADERS = $(INTERMEDIATE_DIR)/include/
export INCLUDE_BUILD_HEADERS

#Architecture to compile for 
ARCH = armv7 

#Location of node_modules
NODE_MODULES = ../node_modules


# React-native path 
REACT-NATIVE = $(NODE_MODULES)/react-native
REACT-NATIVE := $(abspath $(REACT-NATIVE))


#You need theos! Below is simply where I installed it\
#It should be an environment variable anyway. 
#THEOS = /root/theos


###### Compiler Settings #######

#Basic Flags

COMPILER_INCLUDE = -v -MD -MF./temp.txt -I$(INCLUDE_BUILD_HEADERS) -I/root/theos/include/iphone/ -I/root/theos/include/ -I/root/theos/vendor/include -I/root/theos/include/_fallback  -I/root/theos/sdks/iPhoneOS.sdk/usr/include/

# COMPILER_INCLUDE = -v -I/root/theos/include/iphone/ -I/root/theos/include/ -I/root/theos/vendor/include -I/root/theos/include/_fallback  -I/root/theos/sdks/iPhoneOS9.2.sdk/usr/include/

# BASIC_COMPILER_FLAGS = -isysroot "/root/theos/sdks/iPhoneOS9.2.sdk" $(COMPILER_INCLUDE)
BASIC_COMPILER_FLAGS = -isysroot "/root/theos/sdks/iPhoneOS.sdk" $(COMPILER_INCLUDE)

COMPILER_FLAGS +=-std=c++14 -fobjc-arc -Os -g -fmodules -Wextra -Wall

#Warning Flags
COMPILER_FLAGS += -Wno-sign-conversion -Wno-infinite-recursion -Wno-missing-field-initializers -Wno-missing-prototypes      -Werror=return-type -Wunreachable-code -Wno-implicit-atomic-properties -Werror=deprecated-objc-isa-usage -Werror=objc-root-class -Wno-arc-repeated-use-of-weak -Wduplicate-method-match -Wmissing-braces -Wparentheses -Wswitch -Wunused-function -Wno-unused-label -Wno-unused-parameter -Wunused-variable -Wunused-value -Wempty-body -Wconditional-uninitialized -Wno-unknown-pragmas -Wshadow -Wno-four-char-constants -Wno-conversion -Wconstant-conversion -Wint-conversion -Wbool-conversion -Wenum-conversion -Wshorten-64-to-32 -Wpointer-sign -Wno-newline-eof -Wno-selector -Wno-strict-selector-match -Wundeclared-selector -Wno-deprecated-implementations -Wnon-modular-include-in-framework-module -Werror=non-modular-include-in-framework-module -Wno-trigraphs -Wprotocol -Wdeprecated-declarations -Wextra -Wall
#unknown but copied from XCode
COMPILER_FLAGS += -fstrict-aliasing -fasm-blocks
# Enable Modules language feature
COMPILER_FLAGS += -fmodules -fmodules-prune-interval=86400 -fmodules-prune-after=345600
COMPILER_FLAGS += -fpascal-strings -fobjc-abi-version=2 -fobjc-legacy-dispatch


#Basic Include Directories: 


THEOS_INCLUDES = -I/root/theos/include/iphone/ -I/root/theos/include/ -I/root/theos/vendor/include -I/root/theos/include/_fallback -isysroot "/root/theos/sdks/iPhoneOS9.2.sdk"
#Add React Native includes
# COMPILER_INCLUDE += -I$(REACT-NATIVE)/ReactCommon/yoga/ -I$(REACT-NATIVE)/React -I$(REACT-NATIVE)/React/Base -I$(REACT-NATIVE)/CSSLayout
# COMPILER_INCLUDE += -I$(INCLUDE_BUILD_HEADERS)


#Linker Settings
FRAMEWORKS = -framework Foundation -framework CoreFoundation -framework UIKit -framework CoreGraphics    
LINKER_FLAGS = -syslibroot "/root/theos/sdks/iPhoneOS9.2.sdk" -L/root/theos/lib -L/root/theos/vendor/lib 


# SOURCE_DIR := $(REACT-NATIVE)/Libraries/$(FOLDER)

#.m Files to be compiled 
SOURCES := $(abspath $(wildcard $(REACT-NATIVE)/Libraries/$(FOLDER)/*.m)) 

#Where to store the output 
OBJS_DIR = $(abspath ./build/intermediate/$(FOLDER))

#From the Objs_dir we generate the input for the Linker
L_INPUT := $(wildcard $(OBJS_DIR)/*.o)

#Linker Output settings
L_OUTPUT = $(PROJECT_NAME).a
L_OUTPUT_DIR = ./build/final


OBJ_DIR = ./build/intermediate

COMPILER_ALL_FLAGS =  $(COMPILER_FLAGS) $(COMPILER_INCLUDE) -arch $(ARCH)

#Add search directories for include " " 
# COMPILER_INCLUDE += -iquote $(abspath ../node_modules/react-native/Libraries/ART/) -iquote $(sort $(dir $(wildcard ../node_modules/react-native/Libraries/ART/*/)))

#This doesn't work, unfortunately. 
#I need to figure out a way to map #include< React/ * > to the subdirectories that exist. 
# COMPILER_INCLUDE += -I$(REACT-NATIVE)/** -I$(REACT-NATIVE)/React/Views/** --system-header-prefix=React -isystem$(REACT-NATIVE)/React/Base -isystem$(REACT-NATIVE)/React/Views/


# build: 
# 	mkdir -p $(OBJS_DIR)

# 	cd $(OBJS_DIR);  $(COMPILER) $(QUOTE_INCLUDES)  -c $(SOURCES)
	
# L_INPUT := $(wildcard $(OBJS_DIR)/*.o)

# link: 
# 	mkdir -p $(L_OUTPUT_DIR)
# 	$(LINKER) $(FRAMEWORKS) $(LINKER_FLAGS) -o $(L_OUTPUT_DIR)/$(L_OUTPUT) $(L_INPUT)


# .PHONY: clean
# .PHONY: build
# clean:
# 	rm -rf $(OBJS_DIR)
# 	rm -rf $(L_OUTPUT_DIR)/$(L_OUTPUT)