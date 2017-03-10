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
        pbxGroup: proj.hash.project.objects['PBXGroup']
    }
    return info;

}

module.exports = lib