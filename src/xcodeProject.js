//Helper Class for accessing the XCode Project
var xcode = require('xcode');
var lib = require('./lib.js')

class Project {
    /**
     * 
     * @param {string} pathToXCodeProj 
     */
    constructor(pathToXCodeProj) {
        //TODO: Handle errors better
        this.projObj = xcode.project(pathToXCodeProj);
        this.path = pathToXCodeProj;

        this.projObj.parseSync()

        this.getChildFolderObjs = this.getChildFolderObjs.bind(this);

    }

    getChildFolderObjs() {
        var includeFolders = [];

        for (var key in this.pbxGroup) {
            if (lib.isComment(key)) continue;
            var obj = this.pbxGroup[key];
            if (obj.path == null) {
                for (var i = 0; i < obj.children.length; i++) {
                    if (this.pbxGroup[obj.children[i].value]) {
                        //This is a folder 
                        if (this.pbxGroup[obj.children[i].value].path) {
                            includeFolders.push(this.pbxGroup[obj.children[i].value]);
                        }
                    }
                }
            }
        }
        return includeFolders;
    }

    /**Get the source files for a sepcific buildPhase key 
     * @returns array of files
    */
    getSourceFiles(buildPhaseKey) {
        var files = [];
        for (var file of this.sourceFiles[buildPhaseKey].files) {
            var fileRef = this.buildFiles[file.value].fileRef;
            var pathOfFile = this.files[fileRef].path;

            files.push({ obj: this.files[fileRef], path: pathOfFile, fileRef: fileRef });
        }
        return files;
    }

    /**
     * Get the absolute path to a file
     * @param {*} fileObj 
     */
    getFilePath(fileObj) {
        var fileRef = fileObj.fileRef
        for (var key in this.pbxGroup) {
            if (lib.isComment(key)) { continue; }
            //Loop through the folder
            for (var secondKey in this.pbxGroup[key].children) {
                var folderObj = this.pbxGroup[key].children[secondKey]
                if (folderObj.value == fileRef) {
                    //From here we can start generating a path; 
                    if (this.pbxGroup[key].path != null) {
                        //We have to find the parent of the folderObj now.
                        0
                        //But the path so far is: 
                        var pathSoFar = this.getFilePath({ fileRef: key, path: '' }) + this.pbxGroup[key].path + '/' + fileObj.path;
                        return pathSoFar;
                    } else {
                        return this.ContainingFolder + fileObj.path;
                    }
                }
            }

        }
        console.warn("Couldn't find a file");
        console.warn(util.inspect(fileObj))
    }

    /** */
    getBuildPreferences ( ConfigListKey, index  ){
        var index = index | 0;
        
        var buildList = this.buildConfigList[ConfigListKey];

        var buildConfigs = this.coreObj.pbxXCBuildConfigurationSection();
        var config = buildConfigs[buildList.buildConfigurations[index].value]; 

        return config;
    }














    get ContainingFolder() {
        var splitPath = this.path.split('/');
        var result = '';

        for (var i = 0; i < splitPath.length; i++) {
            if (splitPath[i].search(".xcodeproj") != -1) {
                for (var j = 0; j < i; j++) {
                    result += splitPath[j] + "/";
                }
                return result;
            }
        }
    }














    get buildConfigList () { return this.coreObj.hash.project.objects['XCConfigurationList'] }

    get coreObj() { return this.projObj; }
    get buildConfigurationsList() { return this.coreObj.project.objects['XCConfigurationList']; }

    get copyFiles() { return this.coreObj.hash.project.objects['PBXCopyFilesBuildPhase']; }
    get sourceFiles() { return this.coreObj.hash.project.objects['PBXSourcesBuildPhase'] }
    get buildFiles() { return this.coreObj.hash.project.objects['PBXBuildFile']; }
    get projectFiles() { return this.coreObj.pbxFileReferenceSection() };
    get files() { return this.coreObj.pbxFileReferenceSection() }

    get pbxGroup() {
        return this.coreObj.hash.project.objects['PBXGroup']
    }

    get targets() {
        return this.coreObj.pbxNativeTargetSection()
    }

    get frameworkBuildPhase() { return this.coreObj.hash.project.objects['PBXFrameworksBuildPhase'] }

}


module.exports = Project;

