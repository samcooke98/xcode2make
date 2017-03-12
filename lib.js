var xcode = require('xcode');


var lib = {}

lib.dump = (path) => {
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
}

/**
 * @param config - object -  The object from the XCode Library
 * 
 */
//https://pewpewthespells.com/blog/buildsettings.html
lib.ignoredWhenMapping = [];
lib.mapCompilerSettings = (config) => {
    console.log("Mapping Config Object");
    console.log(config);
    var compilerSettings = '';
    var linkerSettings = '';

    for (key in config.buildSettings) {
        var value = config.buildSettings[key]
        switch (key) {
            case "CLANG_CXX_LANGUAGE_STANDARD":
                //TODO: handle this vs. GCC_C_LANGUAGE_STANDARD
                compilerSettings += " -std=" + cleanXCodeString(config.buildSettings[key])
                break;
            case "CLANG_CXX_LIBRARY":
                compilerSettings += " -stdlib=" + cleanXCodeString(config.buildSettings[key]);
                break;
            case "CLANG_ENABLE_MODULES":
                if (value == "YES")
                    compilerSettings += " -fmodules";
                break;
            case "WARNING_CFLAGS":
                for (var i = 0; i < value.length; i++) {
                    compilerSettings += " " + cleanXCodeString(value[i])
                }
                break;
            case "CLANG_ENABLE_OBJC_ARC":
                if (value == "YES")
                    compilerSettings += " -fobjc-arc";
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
                compilerSettings += " -DOBJC_OLD_DISPATCH_PROTOTYPES=0"
                break;
            case "GCC_WARN_SHADOW":
                compilerSettings += warning(value, "shadow");
                break;

            default:
                lib.ignoredWhenMapping.push({ value: config.buildSettings[key], key: key })
                break;
        }
    }
    return { compilerSettings, linkerSettings }
}

/* value = "YES", "YES_ERROR", "NO"), warning = "deprecated-objc-isa-usage" for eg */
function warning(value, warning) {
    if (value == "YES") {
        return " -W" + warning;
    } else if (value == "YES_ERROR") {
        return " -Werror=" + warning;
    } else {
        return " -Wno-" + warning
    }
}





function cleanXCodeString(string) {
    var result = string;
    //Remove ""
    result = result.replace(/\"/g, '');

    return result;
}



module.exports = lib