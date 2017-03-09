var fs = require('fs');
var xcode = require('xcode');

//Get all the pbxproj in the directory to-dump
var path = './to-dump/'

fs.readdir(path, function (err, items) { 
    if(err) {
        console.log( err );
        return;
    }

    for(var item of items) { 
        // console.log(item);
        if(fs.existsSync( path + item + '/project.pbxproj' ) ) { 
            // console.log("Found a Project file, preparing to dump");
            var info = dumpProjectInfo( path + item + "/project.pbxproj");
            createFile((item.split(".xcodeproj")[0]), info );
        }
    }
})

function createFile( fileName, info, output="./Dump/") {
    fs.writeFile( output+fileName+".json", JSON.stringify(info, null, '\t') , function (err) { 
        if(err) { 
            console.log( "Errored while trying to save " + fileName );
            console.log("Error was: " + err);
        }
    })
}
//Write the file




function dumpProjectInfo( path ) { 
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
        sourceBuildPhase: proj.hash.project.objects['PBXSourcesBuildPhase']
    }
    // info.copyFiles= proj.pbxCopyfilesBuildPhaseObj( info.firstProject.firstProject.targets[0].value ) 
    // console.log(proj.pbxNativeTargetSection());
    // for (var i in proj.pbxNativeTargetSection()) { 
    //     // console.log(i);
    //     var a = proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Copy Files', i)
    //     // console.log(proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Copy Files', i
    //     if(a != null) { 
    //         console.log(a)
    //     }

    // console.log(proj.hash.project.objects["PBXCopyFilesBuildPhase"])
    console.log(proj.hash.project.objects["PBXBuildFile"])
    // }
    // console.log(proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Copy Files', "debug"))

    // var sources = this.buildPhaseObject('PBXCopyFilesBuildPhase', 'Copy Files', file.target);
    return info;
}


//Now to generate a makefile

//Build Phase Steps: 
