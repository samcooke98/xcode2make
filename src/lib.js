var xcode = require('xcode');




var lib = {
    /**
     * General function that reads in a xcode project file, and returns a JSON object containing detail about it
     */
    dump: function (path) {
        var proj = xcode.project(path);
        proj.parseSync();
        var info = {
            files: proj.pbxFileReferenceSection(),
            firstProject: proj.getFirstProject(),
            buildConfigSection: proj.pbxXCBuildConfigurationSection(),
            frameworks: proj.pbxGroupByName('Frameworks'),
            resources: proj.pbxGroupByName("Resources"),
            products: proj.pbxGroupByName('Products'),
            plugins: proj.pbxGroupByName("Plugins"),
            sources: proj.pbxGroupByName("Sources"),
            NativeTargetSection: proj.pbxNativeTargetSection(),
            copyFiles: proj.hash.project.objects['PBXCopyFilesBuildPhase'],
            buildFiles: proj.hash.project.objects['PBXBuildFile'],
            sourceBuildPhase: proj.hash.project.objects['PBXSourcesBuildPhase'],
            filePath: path,
            pbxGroup: proj.hash.project.objects['PBXGroup'],
            frameworkBuildPhase: proj.hash.project.objects['PBXFrameworksBuildPhase'],
            buildConfigList: proj.hash.project.objects['XCConfigurationList']
        }
        return info;
    },

    /**
     * Returns an object containg 
     */
    mapCompilerSettings: function (config) {
        var linkerSettings = '';
        var c_compilerSettings = ''
        var compilerSettings = '';
        // var cxx_compilerSettings; 
        //TODO: Handle C++ standards

        for (key in config.buildSettings) {
            var value = config.buildSettings[key]
            switch (key) {
                case "CLANG_CXX_LANGUAGE_STANDARD":
                    //TODO: handle this vs. GCC_C_LANGUAGE_STANDARD
                    // compilerSettings += " -std=" + cleanXCodeString(config.buildSettings[key])
                    switch (cleanXCodeString(config.buildSettings[key])) {
                        case "c++98": compilerSettings += " -std=c++98"; break;
                        case "gnu++98": compilerSettings += " -std=gnu++98"; break;
                        case "c++0x": compilerSettings += " -std=c++11"; break;
                        case "gnu++0x": compilerSettings += " -std=gnu++11"; break;
                        case "c++14": compilerSettings += " -std=c++1y"; break;
                        case "gnu++14": compilerSettings += " -std=gnu++1y"; break;
                        default:
                            console.warn("Not handling CLANG_CXX_LANGUAGE_STANDARD of " + config.buildSettings[key])
                    }
                    break;
                case "CLANG_CXX_LIBRARY":
                    compilerSettings += " -stdlib=" + cleanXCodeString(config.buildSettings[key]);
                    break;
                case "CLANG_ENABLE_MODULES":
                    if (value == "YES")
                        c_compilerSettings, compilerSettings += " -fmodules";

                    break;
                case "WARNING_CFLAGS":
                    for (var i = 0; i < value.length; i++) {
                        compilerSettings += " " + cleanXCodeString(value[i])
                    }
                    break;
                case "CLANG_ENABLE_OBJC_ARC":
                    if (value == "YES")
                        compilerSettings += " -fobjc-arc";
                    c_compilerSettings += "-fobjc-arc";
                    break;
                case "CLANG_WARN_BOOL_CONVERSION":
                    if (value == "YES")
                        compilerSettings += " -Wbool-conversion";
                    else
                        compilerSettings += " -Wno-bool-conversion";
                    break;
                case "CLANG_WARN_CONSTANT_CONVERSION":
                    if (value == "YES")
                        compilerSettings += " -Wconstant-conversion";
                    else
                        compilerSettings += " -Wno-constant-conversion";
                    break;
                case "CLANG_WARN_DIRECT_OBJC_ISA_USAGE":
                    compilerSettings += warning(value, "deprecated-objc-isa-usage");
                    break;
                case "CLANG_WARN_EMPTY_BODY":
                    compilerSettings += warning(value, "empty-body");
                    break;
                case "CLANG_WARN_ENUM_CONVERSION":
                    compilerSettings += warning(value, "enum-conversion");
                    break;
                case "CLANG_WARN_INT_CONVERSION":
                    compilerSettings += warning(value, "int-conversion");
                    break;
                case "CLANG_WARN_OBJC_ROOT_CLASS":
                    compilerSettings += warning(value, "objc-root-class");
                    break;
                case "CLANG_WARN_UNREACHABLE_CODE":
                    compilerSettings += warning(value, "unreachable-code");
                    break;
                case "CLANG_WARN__DUPLICATE_METHOD_MATCH":
                    compilerSettings += warning(value, "duplicate-method-match");
                    break;
                case "COPY_PHASE_STRIP":
                    if (value == "YES")
                        compilerSettings += " -strip-debug-symbols";
                    break;
                case "ENABLE_STRICT_OBJC_MSGSEND":
                    compilerSettings += " -DOBJC_OLD_DISPATCH_PROTOTYPES=0";
                    c_compilerSettings += " -DOBJC_OLD_DISPATCH_PROTOTYPES=0";
                    break;
                case "GCC_WARN_SHADOW":
                    c_compilerSettings += warning(value, "shadow");
                    break;
                case "GCC_C_LANGUAGE_STANDARD":
                    c_compilerSettings += " -std=" + value;
                    break;
                case "GCC_WARN_UNUSED_VARIABLE":
                    c_compilerSettings += warning(value, "unused-variable");
                    break;
                case "GCC_WARN_UNUSED_FUNCTION":
                    c_compilerSettings += warning(value, "unused-function");
                    break;
                case "GCC_SYMBOLS_PRIVATE_EXTERN":
                    if (value == "YES") c_compilerSettings += " -fvisibility=hidden"
                    break;
                case "GCC_WARN_64_TO_32_BIT_CONVERSION":
                    c_compilerSettings += warning(value, "shorten-64-to-32");
                    break;
                case "GCC_WARN_ABOUT_RETURN_TYPE":
                    c_compilerSettings += warning(value, "return-type");
                    break;
                case "GCC_WARN_UNDECLARED_SELECTOR":
                    c_compilerSettings += warning(value, "undeclared-selector");
                    break;
                case "GCC_WARN_UNINITIALIZED_AUTOS":
                    switch (value) {
                        case "YES":
                            c_compilerSettings += " -Wuninitialized";
                            break;
                        case "YES_AGGRESSIVE":
                            c_compilerSettings += " -Wconditional-uninitialized";
                        case "NO":
                            c_compilerSettings += " -Wno-uninitialized";
                    }
                    break;
                case "GCC_DYNAMIC_NO_PIC":
                    if (value == "YES") c_compilerSettings += " -mydnamic-no-pic";
                    break;
                case "GCC_OPTIMIZATION_LEVEL":
                    c_compilerSettings += ` -O${value}`
                    break;
                case "GCC_PREPROCESSOR_DEFINITIONS":
                    if (typeof value == "array") {
                        for (var i = 0; i < value.length; i++) {
                            if (value[i] != '"$(inherited)"') {
                                c_compilerSettings += ` -D${value[i]}`;
                                compilerSettings += ` -D${value[i]}`;
                            }
                        }
                    } else {
                        console.warn("At line 166");
                    }
                    break;
                case "OTHER_LDFLAGS":
                    if (value == '"$(inherited)"') { break; }
                    if (typeof value == "array") {
                        for (var i = 0; i < value.length; i++) {
                            if (value != '"$(inherited)"')
                                linkerSettings += " " + value[i];
                        }
                    } else {
                        linkerSettings += " " + cleanXCodeString(value);
                    }
                    break;
                case "IPHONEOS_DEPLOYMENT_TARGET":
                    compilerSettings += " -miphoneos-version-min=" + value;
                    break;
                case "MTL_ENABLE_DEBUG_INFO":
                    compilerSettings, c_compilerSettings += " -gline-tables-only";
                    break;

                default:
                    addNoDuplicates(key, config.buildSettings[key])
                    break;
            }
        }
        return { compilerSettings, c_compilerSettings, linkerSettings }
    },

    /** XCode strings can often contain extra quotations  */
    cleanXCodeString: function (string) {
        var result = string;
        //Remove ""
        result = result.replace(/\"/g, '');

        return result;
    },

    /** Helper function as ther are times when you want to know if the value you are accessing a key or not */
    isComment: function (string) {
        if (string.match('_comment')) {
            return true;
        } else {
            return false;
        }
    },


}



var cleanXCodeString = lib.cleanXCodeString;



lib.ignoredWhenMapping = [];
/**
 * Helper function to prevent any duplicates being stored in the ignoredWhenMapping helper array
 * @param {*} key 
 * @param {*} value 
 */
function addNoDuplicates(key, value) {
    for (var obj of lib.ignoredWhenMapping) {
        if (obj.key == key) {
            return;
        }
    }
    lib.ignoredWhenMapping.push({ key: key, value: value });
}




/* value = "YES", "YES_ERROR", "NO"), warning = "deprecated-objc-isa-usage" for eg */
/**
 * Helper function to generate compiler flag for warning settings
 * @param {string} value 
 * @param {string} warning 
 */
function warning(value, warning) {
    if (value == "YES") {
        return " -W" + warning;
    } else if (value == "YES_ERROR") {
        return " -Werror=" + warning;
    } else {
        return " -Wno-" + warning
    }
}



module.exports = lib


function getFilePath(projObj, fileObj) {
    var fileRef = fileObj.fileRef
    for (var key in projObj.pbxGroup) {
        if (!isComment(key)) {
            //Loop through the folder
            for (var secondKey in projObj.pbxGroup[key].children) {
                var folderObj = projObj.pbxGroup[key].children[secondKey]
                if (folderObj.value == fileRef) {
                    //From here we can start generating a path; 
                    if (projObj.pbxGroup[key].path != null) {
                        //We have to find the parent of the folderObj now.
                        //But the path so far is: 
                        var pathSoFar = getFilePath(projObj, { fileRef: key, path: '' }) + projObj.pbxGroup[key].path + '/' + fileObj.path;
                        return pathSoFar;
                    } else {
                        var pathSplit = projObj.filePath.split('/');
                        var path = '';
                        for (var i = 0; i < pathSplit.length; i++) {
                            if (pathSplit[i].search(".xcodeproj") != -1) {
                                for (var j = 0; j < i; j++) {
                                    path += pathSplit[j] + '/'
                                }
                            }
                        }
                        return path + fileObj.path;
                    }
                }
            }
        }
    }
    console.warn("Couldn't find a file");
    console.warn(util.inspect(fileObj))

}