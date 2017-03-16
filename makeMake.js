//File to generate a Makefile

var fs = require('fs');
var util = require('util');
var xcode = require('xcode')
var pathLib = require('path');

var lib = require('./src/lib.js');

var makeInfo = {}


var makeInfos = [];

function main(xcodeInfo) {
    console.log("------------- Working on project:" + xcodeInfo.filePath + " ---------");
    obj = xcodeInfo;

    //Set up the makeInfo array
    var makeInfos = [];

    var targets = obj.NativeTargetSection
    console.log("This project has : " + Object.keys(targets).length / 2 + " targets")

    for (var key in targets) {
        if (isComment(key) == false) {
            // console.log(targets[key+"_comment"])
            //For now, we won't support tvOS: 
            if (targets[key + "_comment"].match("-tvOS")) {
                //The reasoning for this is because the targets are the same 
                console.log("Currently, we're not trying to support tvOS, so we're skipping.");
                continue;
            }
            var makeInfo = {};
            makeInfo.file = xcodeInfo.filePath;

            var buildPhases = (targets[key].buildPhases);
            console.log("---- Build Phases ----");
            console.log(buildPhases)

            for (var i = 0; i < buildPhases.length; i++) {
                var newMakeInfo = handleBuildPhase(buildPhases[i], obj, makeInfo);
                makeInfo = newMakeInfo;
            }


            //Get the Project Build useBuildPrefs

            makeInfo = generateBuildPreferences(obj, obj.firstProject.firstProject.buildConfigurationList, makeInfo);

            //Get the Build Preferences 
            makeInfo = generateBuildPreferences(obj, targets[key].buildConfigurationList, makeInfo);

            //Other general info: (This feels wrong!)
            makeInfo.name = targets[key].name
            makeInfo.product = targets[key].productReference_comment;
            makeInfo.path = obj.filePath;
            makeInfos.push(makeInfo);
        }
    }
    console.log("------ Gathered the following makefile info --------")
    console.log(JSON.stringify(makeInfos, null, "\t"));
    // var targetName = makeInfo.name; //ie: libRCTGeolocation
    // var product = makeInfo.product; //ie: libRCTGeolocation.a

    //Generate the makefile 
    // generateMakefile(makeInfo, obj)
    generateMakefiles(makeInfos, obj)


    console.log("--------------Finished File-----------------")
}





var masterMake = '';

function generateMakefile(makeInfo, projObj) {
    var targetName = makeInfo.name; //ie: libRCTGeolocation
    var product = makeInfo.product; //ie: libRCTGeolocation.a

    //This will contain variable definitions
    var startOfFile = '';
    //This will contain the shell steps to build the file. 
    var buildSteps = ''

    //Used to store the recipes for .o files
    var recipes = ''
    //Used to create the recipe for the header files
    var CopyHeaderRule = "";

    //Header Variables 
    var varForCopyHeaders = `${targetName.toUpperCase()}_COPY_HEADERS_SRC`
    var varForHeadersDest = `${targetName.toUpperCase()}_COPY_HEADERS_DEST`
    var varForHeadersResult = `${targetName.toUpperCase()}_COPY_HEADERS_RESULT`

    //Var for source Files
    var varForSourceFiles = `${targetName.toUpperCase()}_SOURCE_FILES`
    var varForFramework = `${targetName.toUpperCase()}_REQUIRED_FRAMEWORKS`

    //ObjectiveC Compiler Flags
    var varForCompilerFlags = `${targetName.toUpperCase()}_COMPILER_FLAGS`

    //CC Compiler Flags
    var varForC_CompilerFlags = `${targetName.toUpperCase()}_C_COMPILER_FLAGS`
    //Linker Flags 
    var varForLinkerFlags = `${targetName.toUpperCase()}_LINKER_FLAGS`

    //var for Objects Directory 
    var varForObj_Dir = `${targetName.toUpperCase()}_OBJ_DIR`;

    //Var for OBjects
    var varForCObjects = `${targetName.toUpperCase()}_C_OBJS`;
    var varForCXXObjects = `${targetName.toUpperCase()}_CXX_OBJS`;
    var varForObjCObjects = `${targetName.toUpperCase()}_OBJC_OBJS`;
    var varForAllObjects = `${targetName.toUpperCase()}_ALL_OBJS`;

    //Source File Variables
    var varForCFiles = `${targetName.toUpperCase()}_C_FILES`;
    var varForCXXFiles = `${targetName.toUpperCase()}_CXX_FILES`;
    var varForObjCFiles = `${targetName.toUpperCase()}_OBJC_FILES`;


    //Recipe to make the object directory
    recipes += `$(${varForObj_Dir}): \n\tmkdir -p $(${varForObj_Dir}) \n`


    //Define the Object directory
    startOfFile += `${varForObj_Dir} := $(OBJ_DIR)/${targetName}\n`

    var prerequisites = `$(${varForHeadersResult}) $(${varForAllObjects}) `;
    /* Generate Frameworks Build Step */
    if (makeInfo.depends) {
        //If there are depenedencies add them to the pre-reqs
        prerequisites += `$(${varForFramework})`

        //Define the variable 
        var str = '';
        for (fileObj of makeInfo.depends) {
            str += fileObj.fileRef_comment + " ";
        }
        startOfFile += `${varForFramework} = ${str}\n`
    }



    /* Generate Build Preferences */
    var { compilerSettings, c_compilerSettings, linkerSettings } = lib.mapCompilerSettings(makeInfo.buildConfig);
    console.warn(util.inspect(lib.ignoredWhenMapping, true, null));
    // console.warn(util.inspect(makeInfo.buildConfig, true, null));

    //TODO: Add to the ".." search paths 
    var result = lib.getIncludeFolders(projObj)
    for (obj of result) {
        var folderPath = getRootProjFolder(makeInfo) + obj.path;
        c_compilerSettings += " -iquote " + folderPath;
        compilerSettings += " -iquote " + folderPath;
    }
    c_compilerSettings += " -iquote " + getRootProjFolder(makeInfo);

    startOfFile += `${varForCompilerFlags} = ${compilerSettings}\n${varForLinkerFlags} = ${linkerSettings}\n`
    startOfFile += `${varForC_CompilerFlags} = ${c_compilerSettings}\n`

    /* Generate the step for headers, if necessary */
    if (makeInfo.copyHeaders != undefined) {
        //NOTE: In reality, this probably heavily depends on the dstSubFolderSpec variable.
        //TODO: The target path should be absolute, and the destination path should be relying on a variable include_dir
        var headersToMove = '';
        for (var i = 0; i < makeInfo.copyHeaders.filesToCopy.length; i++) {
            // data += getFilePath(projObj, makeInfo.copyHeaders.filesToCopy[i]) + ' ';
            headersToMove += (getFilePath(projObj, makeInfo.copyHeaders.filesToCopy[i]) + ' ').replace(/\"/g, '')

        }
        //output
        startOfFile += `${varForCopyHeaders} = ${headersToMove} \n`
        startOfFile += `${varForHeadersDest} := $(abspath $(INCLUDE_BUILD_HEADERS)/../${makeInfo.copyHeaders.destination})\n`
        startOfFile += `${varForHeadersResult} = $(addprefix $(${varForHeadersDest})/, $(notdir $(${varForCopyHeaders})))\n`

        CopyHeaderRule += `$(${varForHeadersResult}): \n\t`;
        CopyHeaderRule += "@echo Generating Header Folder\n\t"
        CopyHeaderRule += `mkdir -p $(${varForHeadersDest})\n\t`
        CopyHeaderRule += "@echo Copying headers...\n\t"
        CopyHeaderRule += `-@ cp --target-directory=$(${varForHeadersDest}) $(${varForCopyHeaders})\n\t`
    }
    if (makeInfo.sourceFiles.length != 0) {
        // Get a list of all source files 
        var sourceFiles = ''
        for (file of makeInfo.sourceFiles) {
            // console.log(file)
            var str = getFilePath(projObj, file) || 'err'
            sourceFiles += `${str.replace(/\"/g, '')} `
        }
        startOfFile += `${varForSourceFiles} = ${sourceFiles}\n`
        startOfFile += `${varForSourceFiles} := $(realpath $(${varForSourceFiles}))\n`

        //Add the separate files
        startOfFile += `${varForCFiles} := $(filter %.c, $(${varForSourceFiles}))\n`
        startOfFile += `${varForCObjects} := $(addprefix $(${varForObj_Dir})/, $(notdir $(patsubst  %.c, %.c.o, $(${varForCFiles}))))\n`

        startOfFile += `${varForObjCFiles} := $(filter %.m, $(${varForSourceFiles}))\n`
        startOfFile += `${varForObjCObjects} := $(addprefix $(${varForObj_Dir})/, $(notdir $(patsubst %.m, %.m.o, $(${varForObjCFiles}))))\n`

        startOfFile += `${varForCXXFiles} := $(filter %.cpp, $(${varForSourceFiles}))\n`
        startOfFile += `${varForCXXObjects} := $(addprefix $(${varForObj_Dir})/, $(notdir $(patsubst %.cpp, %.cpp.o, $(${varForCXXFiles}))))\n`

        startOfFile += `${varForAllObjects} := $(${varForCXXObjects}) $(${varForCObjects}) $(${varForObjCObjects}) `

        //Generate the Recipes
        recipes += `$(${varForCObjects}): $(${varForCFiles}) | $(${varForObj_Dir})`
        recipes += `\n\t@echo Building c files for ${targetName}`
        recipes += `\n\t$(CC_COMPILER) $(${varForC_CompilerFlags}) -c $(filter %/$(notdir $(patsubst  %.c.o, %.c, $@ )), $(${varForCFiles})) -o $@`
        recipes += '\n\n'

        //C++  files
        recipes += `$(${varForCXXObjects}): $(${varForCXXFiles}) | $(${varForObj_Dir})`
        recipes += `\n\t@echo Building c++ files for ${targetName}`
        recipes += `\n\t$(CXX_COMPILER) $(${varForCompilerFlags}) -c $(filter %/$(notdir $(patsubst  %.cpp.o, %.cpp, $@ )), $(${varForCXXFiles})) -o $@`
        recipes += "\n\n"

        //ObjC files
        recipes += `$(${varForObjCObjects}): $(${varForObjCFiles}) | $(${varForObj_Dir})`
        recipes += `\n\t@echo Building obj-c files for ${targetName}`
        recipes += `\n\t$(CC_COMPILER) $(${varForC_CompilerFlags}) -c $(filter %/$(notdir $(patsubst  %.m.o, %.m, $@ )), $(${varForObjCFiles})) -o $@`
    }
    /* Generate Linker Step */
    //Linker step
    buildSteps += `${product}: ${prerequisites}\n\t`
    buildSteps += `@echo Linking files to become: ${product} \n\t`
    buildSteps += `@ mkdir -p $(L_OUTPUT_DIR)\n\t`
    buildSteps += `$(LINKER) $(FRAMEWORKS) $(LINKER_FLAGS) -o $(L_OUTPUT_DIR)/${product} $(wildcard $(${varForObj_Dir})/*.o)\n\t`


    data = `all: ${product}\n\n` + startOfFile + "\n" + CopyHeaderRule + "\n" + recipes + "\n" + buildSteps;

    return data;
}

//makeInfos: array of MakeInfo, obj: ProjObj
function generateMakefiles(makeInfos, obj) {
    var data = '#Makefile  generated by makeMake.js\n'
    data += "include ./makefiles/lib/common.mk\n"
    var fileName = 'React2.mk'

    for (makeInfo of makeInfos) {
        data = '';
        var fileName = makeInfo.name + '.mk';

        data += "include ./makefiles/lib/common.mk\n"

        data += "\n#Build section for target: " + makeInfo.name + '\n'
        data += "\n"
        // data += "OBJS_DIR := $(OBJS_DIR)/" + makeInfo.name + "/\n"
        data += generateMakefile(makeInfo, obj)
        data += "\n#End build section for target: " + makeInfo.name


        fs.writeFileSync("./makefiles/" + fileName, data)
    }

    //TODO: Generate makefile that includes all the files 

}


// ../ReactCommon/yoga/yoga/YGEnums.h
//Find the first file. Then work backwards up the tree
//Then merge with the folder that contains the .xcodeproj
//Therefore absolute path






// start("./node_modules/react-native/Libraries/ART/ART.xcodeproj/project.pbxproj")
// start("./node_modules/react-native/Libraries/ActionSheetIOS/RCTActionSheet.xcodeproj/project.pbxproj")
// start("./node_modules/react-native/Libraries/AdSupport/RCTAdSupport.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/WebSocket/RCTWebSocket.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/Vibration/RCTVibration.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/Text/RCTText.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/Settings/RCTsettings.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/Sample/Sample.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/RCTTest/RCTTest.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/PushNotificationIOS/RCTPushNotification.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/Network/RCTNetwork.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/NativeAnimation/RCTAnimation.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/LinkingIOS/RCTLinking.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/Image/RCTImage.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/Geolocation/RCTGeolocation.xcodeproj/project.pbxproj");
// start("./node_modules/react-native/Libraries/CameraRoll/RCTCameraRoll.xcodeproj/project.pbxproj");


start("./node_modules/react-native/React/React.xcodeproj/project.pbxproj")
// start("../RoosterSecond/ios/RoosterSecond.xcodeproj/project.pbxproj")

function start(pathToProject) {
    var info = lib.dump(pathToProject);
    fs.writeFileSync("dump.json", JSON.stringify(info, null, "\t"));
    main(info)
}





/* 
TODO List: 
    Handle Paths better! - Currently they aren't real! - done
        Make paths absolute?

    Finalise the Copy headers step - done
 
    Ensure all dependencys are linked properly (relies on step 1) - done
        going to assume the buildphase - Frameworks, is a list of dependencys
        Seems like it is,
        The problem now is that we need to merge the files 
        ie: Building the makefile for the RoosterSecond needs to get the makeInfo for libReact, and add that to the makefile.
        Basically the output must be one file, (or multiple files and 1 makefile including them all together...)

    Create the Linker step - Try to do it using rules???
        - done( i think ) hard to test because the compilation often fails.

    Use the build preferences information 

    Separate Compiling C vs C++ vs ObjC (as they are different settings) - done (i think)
        Do this by generating a separate makefile for each project. ie: 
        gcc_c_language_standard vs CLANG_CXX_LANGUAGE_STANDARD ??/

    Make the build all step

    Create the step to actually generate the .app folder
    
    Handle other BuildPhases 

*/


