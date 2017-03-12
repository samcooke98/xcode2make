
LIBYOGA_HEADERS_MOVE = yoga/YGEnums.h yoga/YGMacros.h yoga/Yoga.h 

LIBYOGA_SOURCES_BUILD = ./node_modules/react-native/React/yoga/YGNodeList.c ./node_modules/react-native/React/yoga/Yoga.c 
LIBYOGA_ALL_FILES =  ALL_FILES 

libyoga.a:  $(LIBYOGA_ALL_FILES) $(LIBYOGA_DEPS) 
	@echo Copying Header files

	@echo Building Object Files 

	@echo Linking Object Files to $(output)

	

	#Copy files 

	$(COMPILER) $(LIBYOGA_SOURCES_BUILD);
	$(LINKER) $(LINK)
	QUOTE_INCLUDES = yoga/YGEnums.h yoga/YGMacros.h yoga/Yoga.h 
	SOURCES = ./node_modules/react-native/React/yoga/YGNodeList.c ./node_modules/react-native/React/yoga/Yoga.c 
	SOURCES := $(abspath $(SOURCES))