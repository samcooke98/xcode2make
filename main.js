var Project = require('./src/xcodeProject.js');
var { Makefile, Variable, Rule } = require('./src/makeFile.js');
var lib = require('./src/lib.js');
var fs = require('fs');

var unhandledBuildPhases = []

function main(pathToProject) {
    var proj = new Project(pathToProject);

    /* Get the Targets */
    var targets = proj.targets;
    for (var key in targets) {
        //If the key is a comment, then skip;
        if (lib.isComment(key)) { continue; }

        //If the target mentions -tvOS, we skip. 
        if (targets[key + "_comment"].match("-tvOS")) {
            //So, tvOS requires a different SDK. For now, not supported
            continue;
        }

        //Onto the good stuff.
        var target = targets[key];

        var makeFile = new Makefile();

        //Generate the Rule for the makefile
        var name = lib.cleanXCodeString(target.name);
        var recipe = new Rule(target.productReference_comment);
        makeFile.addDirectives( "include ./makefiles/common.mk")

        makeFile.addRule(recipe);


        //Variables that may or may not be populated
        var sourceFiles = new Variable(name.toUpperCase() + "_SOURCE_FILES", 'nil');
        var objectFiles = new Variable(name.toUpperCase() + "_OBJECT_FILES", '$(patsubst %.%, %.o, ' + sourceFiles.referenceStr + ")")

        var headerFiles = new Variable(name.toUpperCase() + "_HEADER_FILES", 'nil');
        var headerDest = new Variable(name.toUpperCase() + "_HEADER_DEST", "nil");

        var dependency = new Variable( name.toUpperCase() + "_REQ_FRAMEWORKS", "nil");

        makeFile.addVariable(sourceFiles);
        makeFile.addVariable(objectFiles);
        makeFile.addVariable(headerFiles);
        makeFile.addVariable(headerDest);
        makeFile.addVariable(dependency);

        //Get the Build Phase
        var buildPhase = target.buildPhases;
        for (var key in buildPhase) {
            var phase = buildPhase[key];
            switch (phase.comment) {
                case "Sources":
                    // console.log("Sources - This step is compiliation");

                    //Get all the source files
                    var files = proj.getSourceFiles(phase.value);

                    //Convert them to a list
                    var list = '';
                    for (var file of files) {
                        //Get the path to the file
                        var path = proj.getFilePath(file);
                        //Add it to the value of the the Variable
                        list += `${path} `
                    }
                    //Set the sourceFile variable to the list, and add as a dependency
                    sourceFiles.value = list;
                    recipe.addPrerequisite(objectFiles.referenceStr)
                    break;
                case "Headers":
                    // console.warn("Unknown what the Headers step involves");
                    break;
                case "Copy Headers":
                    // console.log("This step copies Header Files from a given location, to another")
                    var info = proj.copyFiles[phase.value];
                    //TODO: This should probably use the dstSubFolderSpec as well.
                    headerDest.value = info.dstPath;

                    //Get the files as a list
                    var list = '';
                    for (var file of info.files) {
                        var file = { 
                            path: proj.files[proj.buildFiles[file.value].fileRef].path,
                            fileRef: proj.buildFiles[file.value].fileRef,
                            fileOBj: proj.files[proj.buildFiles[file.value].fileRef]
                        }
                        var path = proj.getFilePath(file);

                        list += `${path} `
                    }
                    headerFiles.value = list;
                    //Add pre-requisite
                    recipe.addPrerequisite(headerFiles);
                    break;
                case "CopyFiles":
                    //Again, as far as I can tell we don't need to do anything special
                    break;
                case "Frameworks":
                    //NOTE:  Assuming that the Frameworks build phase is a dependency 
                    var list = '';
                    var data = proj.frameworkBuildPhase[phase.value]
                    for(var file of data.files) {
                        var fileObj = proj.buildFiles[file.value];
                        var path = proj.getFilePath({ 
                            path: proj.files[fileObj.fileRef].path,
                            fileRef: fileObj.fileRef,
                        });
                        list += (proj.files[fileObj.fileRef].path) + ' ';
                    }
                    dependency.value = list;
                    recipe.addPrerequisite(dependency);
                    break;
                default:
                    console.log("Not sure how to handle buildPhase of " + phase.comment)
                    if (unhandledBuildPhases.indexOf(phase.comment) == -1) {
                        unhandledBuildPhases.push(phase.comment)
                    }
            }
        }

        //Get build preferences
        var buildConfig = proj.getBuildPreferences( proj.coreObj.getFirstProject().firstProject.buildConfigurationList , 0);
        var buildConfig2 = proj.getBuildPreferences( target.buildConfigurationList, 0);
        //Merge
        Object.assign(buildConfig, buildConfig2); 
        
        //Map them to the flags
        var { compilerSettings, c_compilerSettings, linkerSettings } = lib.mapCompilerSettings(buildConfig);

        //Feed them to the Variables


        //Combine everything into the makefile now.



        //Get the resultant makefile.
        var text = (makeFile.toString());
        fs.writeFileSync( "./makefiles/" + target.name + '.mk', text);
    }


}

main("./node_modules/react-native/React/React.xcodeproj/project.pbxproj");

function test(pathToProject) {
    // console.log("Path is: " + pathToProject);

    var project = new Project(pathToProject);
    // console.log(project);

    // console.log("--- Containing Folder --- ");
    // console.log(project.ContainingFolder)

    // console.log(project.copyFiles) 
    // console.log(project.buildFiles);
    // console.log(project.projectFiles);

    var output = project.getChildFolderObjs();
    console.log(output);
    console.log(project instanceof Project);

    var make = new Makefile();
    var main = new Rule("main.o");
    main.addPrerequisite('foo.c');
    main.addRecipeStep('$(gcc) foo.c');

    make.addRule(main);

    console.log(make.toString());

}