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
        console.log(item);
        if(fs.existsSync( path + item + '/project.pbxproj' ) ) { 
            console.log("Found a Project file, preparing to dump");
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
        BuildConfigSection: proj.pbxXCBuildConfigurationSection()
    }
    console.log(JSON.stringify(info));
    return info;
}
