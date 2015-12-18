// Crappy `cp` implementation for Windows Script Host that can copy files out of
// zip archives.

// Invoke like this:
// > cscript cp.js %SOURCE% %DESTINATION%

// Based on this script:
// http://stackoverflow.com/questions/1021557/how-to-unzip-a-file-using-the-command-line#answer-7947219

// FileSystemObject: https://msdn.microsoft.com/en-us/library/hww8txat.aspx
var filesystem = new ActiveXObject("Scripting.FileSystemObject");

// https://msdn.microsoft.com/en-us/library/windows/desktop/bb774094.aspx
var shell = new ActiveXObject("Shell.Application");

function copy (sourcePath, destinationPath) {
    var fullSource = filesystem.GetAbsolutePathName(sourcePath);
    var fullDestination = filesystem.GetAbsolutePathName(destinationPath);
    
    var sourceFolder = filesystem.GetParentFolderName(fullSource);
    var sourceFilename = filesystem.GetFileName(fullSource);
    
    try {
        var source = shell.NameSpace(sourceFolder).parseName(sourceFilename);
    } catch(e) {
        WScript.Echo("Error: Source path " + fullSource + " not found");
        return 1;
    }
    
    try {
        var destination = shell.NameSpace(fullDestination);

        // I'm not clear on the behavior of NameSpace() if folders don't exist
        // or are empty. I think it returns null if the folder is really a file,
        // and it's easier to handle it all in one place, so I throw an error.
        if (destination === null) throw new Error('');
    } catch(e) {
        // Destination doesn't exist. User must have put the desired filename
        // at the end.
        var destinationFolder = filesystem.GetParentFolderName(fullDestination);
        var destinationFilename = filesystem.GetFileName(fullDestination);

        try {
            destination = shell.NameSpace(destinationFolder);
            if (destination === null) throw new Error('');
        } catch(e) {
            // Containing folder doesn't exist.
            WScript.Echo("Error: Destination path " + destinationFolder + " not found");
            
            return 1;
        }
        
        WScript.Echo("Copying:");
        WScript.Echo("  " + sourceFolder + "\\" + sourceFilename);
        WScript.Echo("to directory:");
        WScript.Echo("  " + destinationFolder);
        destination.CopyHere(source);
        
        // Rename file to desired name
        if (filesystem.FileExists(destinationFolder + "\\" + sourceFilename)) {
            WScript.Echo("Renaming file:");
            WScript.Echo("  " + destinationFolder + "\\" + sourceFilename);
            WScript.Echo("to:");
            WScript.Echo("  " + destinationFolder + "\\" + destinationFilename);

            filesystem.GetFile(destinationFolder + "\\" + sourceFilename)
                .Move(destinationFolder + "\\" + destinationFilename);
        }
        else if (filesystem.FolderExists(destinationFolder + "\\" + sourceFilename)) {
            WScript.Echo("Renaming directory:");
            WScript.Echo("  " + destinationFolder + "\\" + sourceFilename);
            WScript.Echo("to:");
            WScript.Echo("  " + destinationFolder + "\\" + destinationFilename);

            filesystem.GetFolder(destinationFolder + "\\" + sourceFilename)
                .Move(destinationFolder + "\\" + destinationFilename);
        }
        else {
            WScript.Echo("Error: I can't see the destination file");
            WScript.Echo("    " + destinationFolder + "\\" + sourceFilename);
            WScript.Echo("to rename it to");
            WScript.Echo("    " + destinationFolder + "\\" + destinationFilename);
        }
        
        return 0;
    }

    WScript.Echo("Copying:");
    WScript.Echo("  " + sourceFolder + "\\" + sourceFilename);
    WScript.Echo("to directory:");
    WScript.Echo("  " + fullDestination);
    destination.CopyHere(source);
    
    return 0;
}

var source = WScript.Arguments(0);
var destination = WScript.Arguments(1);
copy(source, destination);
