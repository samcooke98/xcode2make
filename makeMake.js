//File to generate a Makefile

var fs = require('fs');
var util = require('util')


var makeInfo = {}

openFile = (file) => {
    return JSON.parse(fs.readFileSync(file));
}
var makeInfos = [];
function main(file) {
    console.log("------------- Starting File: " + file + " ---------");
    obj = openFile(file);

    //Set up the makeInfo object
    makeInfo.file = file;

    var targets = obj.NativeTargetSection
    console.log("This project has : " + Object.keys(targets).length / 2 + " targets")

    for (var key in targets) {
        if (isComment(key) == false) {
            // console.log(targets[key+"_comment"])
            //For now, we won't support tvOS: 
            if (targets[key + "_comment"].match("-tvOS")) {
                console.log("Currently, we're not trying to support tvOS, so we're skipping.");
                continue;

            }

            var buildPhases = (targets[key].buildPhases);
            console.log("---- Build Phases ----");
            console.log(buildPhases)

            for (var i = 0; i < buildPhases.length; i++) {
                handleBuildPhase(buildPhases[i], obj);
            }
        }
    }
    makeInfos.push(makeInfo);
    makeInfo = {};
    console.log("--------------Finished File-----------------")
}

var unhandledBuildPhases = []



function handleBuildPhase(buildPhase, obj) {

    var buildPhaseComment = buildPhase.comment;
    switch (buildPhaseComment) {
        case "Sources":
            // console.log("Sources - This step is compiliation");
            generateMakeForSourcePhase(obj, buildPhase)
            break;
        case "Headers":
            // console.warn("Unknown what the Headers step involves");
            break;
        case "Copy Headers":
            // console.log("This step copies Header Files from a given location, to another")
            makeCopyHeaderSection(obj, buildPhase)
            break;
        case "CopyFiles":
            //Again, as far as I can tell we don't need to do anything special
            break;
        default:
            console.log("Not sure how to handle buildPhase of " + buildPhaseComment)
            if (unhandledBuildPhases.indexOf(buildPhaseComment) == -1) {
                unhandledBuildPhases.push(buildPhaseComment)
            }
    }

}

//Get Build Phases


function generateMakeForSourcePhase(obj) {
    var sourceBuildPhase = obj.sourceBuildPhase;
    // console.log("The following files would be compiled")
    //Set up saving
    makeInfo.sourceFiles = []

    for (var key in sourceBuildPhase) {
        if (isComment(key) == false) {
            // var fileObj = console.log(sourceBuildPhase[key].files )
            for (file of sourceBuildPhase[key].files) {
                // console.log(file.value)

                //Get the detail from the buildFileSection
                var fileRef = obj.buildFiles[file.value].fileRef;

                //Use this to get the path
                var file = obj.files[fileRef];
                var pathOfFile = obj.files[fileRef].path;
                // console.log(pathOfFile);

                //TODO: use this to do something
                makeInfo.sourceFiles.push({ path: pathOfFile })
            }
            //Get the actual information about the file 
        }
    }
}


function makeCopyHeaderSection(obj, phase) {
    //Set up the saving
    makeInfo.copyHeaders = {
        destination: null,
        filesToCopy: []
    }
    //Get the copy header section for the given key
    var info = (obj.copyFiles[phase.value])

    var destination = info.dstPath;
    var destinationParent = info.dstSubFolderSpec;

    makeInfo.copyHeaders.destination = destination;

    //Get the files from the buildFiles section 
    for (file of info.files) {
        //Gets the fileRef
        // console.log(obj.buildFiles[file.value]);

        //Get the path to the file from the projectFiles
        console.log(obj.files[obj.buildFiles[file.value].fileRef].path);

        // //TODO: Do something with them.
        makeInfo.copyHeaders.filesToCopy.push( obj.files[obj.buildFiles[file.value].fileRef].path);


    }


}

/* Build Phase Types */
/* 
    Sources: General Compiliation 

*/

/* TODO */
/* Read the Build detail */
/* Actually generate something to compile with */

/*
 So we generate a master make, this has targets such as RCTImage.a



 */




function isComment(string) {
    if (string.match('_comment')) {
        return true;
    } else {
        return false;
    }
}



//For all the .json in ./Dump, run main on them
fs.readdir("./Dump/", function (err, items) {
    for (file of items) {
        if (file.match('.json')) {
            main("./Dump/" + file);
        }
    }
    console.log("-- Unhandle Build Phases: --")
    console.log(unhandledBuildPhases)
    console.log("-- Make Information --");
    console.log(util.inspect(makeInfos, true, null));
})