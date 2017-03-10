//File to generate a Makefile

var fs = require('fs');
var util = require('util');
var xcode = require('xcode')
var pathLib = require('path');

var dumpLib = require('./lib.js');

var makeInfo = {}

openFile = (file) => {
    return JSON.parse(fs.readFileSync(file));
}
var makeInfos = [];
function main(xcodeInfo) {
    console.log("------------- Working on project:" + xcodeInfo.filePath +  " ---------");
    obj = xcodeInfo;

    //Set up the makeInfo object
    makeInfo.file = xcodeInfo.filePath;

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
            //Other general info: (This feels wrong!)
            makeInfo.name = targets[key].name
            makeInfo.product = targets[key].productReference_comment;
            makeInfo.path = obj.filePath;
        }
    }


    var targetName = makeInfo.name; //ie: libRCTGeolocation
    var product = makeInfo.product; //ie: libRCTGeolocation.a

    //Generate the makefile 
    generateMakefile( makeInfo ) 

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

                makeInfo.sourceFiles.push({ path: pathOfFile, fileRef: fileRef, obj: obj.files[fileRef] })
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
        makeInfo.copyHeaders.filesToCopy.push(obj.files[obj.buildFiles[file.value].fileRef].path);


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
ie: 
makefile
    RCTImage.a: 
        make -f RCTImage.mk all 
RCTImage.mk
    all: 
        #Run the separate targets, 
    copyHeaders: 
        #copy Headers
    compile: 
        #Compile 
    link: 
        #link


 */




function isComment(string) {
    if (string.match('_comment')) {
        return true;
    } else {
        return false;
    }
}



//For all the .json in ./Dump, run main on them
// fs.readdir("./Dump/", function (err, items) {
//     for (file of items) {
//         if (file.match('.json')) {
//             main("./Dump/" + file);
//         }
//     }
//     console.log("-- Unhandle Build Phases: --")
//     console.log(unhandledBuildPhases)
//     console.log("-- Make Information --");
//     console.log(util.inspect(makeInfos, true, null));

//     for (make of makeInfos) {
//         generateMakefile(make);
//     }
// })

var masterMake = '';

function generateMakefile(makeInfo) {
    var targetName = makeInfo.name; //ie: libRCTGeolocation
    var product = makeInfo.product; //ie: libRCTGeolocation.a

    //Filename for the specific makefile
    var fileName = targetName + ".mk"
    //Output to masterMakefile
    masterMake += `${product}: \n\t make -f ${fileName} all\n`

    /* Generate the specific target file */
    var data = ``;
    if (makeInfo.copyHeaders != undefined) {
        //Build: CopyHeaders target 
    }
    if (makeInfo.sourceFiles.length != 0) {
        //  ${makeInfo.path+file
        var path = '';
        //Far out this is hacky, and feels wrong
        //Going to chuck a solid todo that I never come back to
        //TODO: Make this nicer ? 
        var a = makeInfo.path.split('/');
        for (var i = 0; i < a.length; i++) {
            if (a[i].search(".xcodeproj") != -1) {
                for (var j = 0; j < i; j++) {
                    path += a[j] + "/";
                }
                // path += a[i].replace(".xcodeproj", "/");
                console.log(path)
                break;
            }
        }
        console.log(path)

        data += "\ninclude ./lib/common.mk \n\nSOURCES = "
        for (file of makeInfo.sourceFiles) {
            console.log(file)
            // data += `${pathLib.resolve(path + file.path.replace(/\"/g, '')) } `
            //So... sometimes the XCode path lies,
            //TODO: Read from XCOde Properly, 
            data+= `${path + file.path.replace(/\"/g, '')} `
        }
    }
    fs.writeFileSync("./makefiles/" + fileName, data)
}


function getFilePath ( projObj, fileRef) {


    
}


/*
So we generate a master make, this has targets such as RCTImage.a
ie: 
makefile
    RCTImage.a: 
        make -f RCTImage.mk all 
RCTImage.mk
    all: 
        #Run the separate targets, 
    copyHeaders: 
        #copy Headers
    compile: 
        #Compile 
    link: 
        #link

 */


//TODO tomorrow: /
//Connect the dumper and the makeMake 
//Take an input for a directory containing an xcodeproj folder,
//Generate a makefile that compiles the code

start("./node_modules/react-native/Libraries/ART/ART.xcodeproj/project.pbxproj")

function start(pathToProject) {
    var info = dumpLib.dump(pathToProject);
    console.log(info)
    main(info)

}