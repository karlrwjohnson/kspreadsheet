// Windows 7 appears to lack a good way to download files. StackOverflow
// recommends one of the following:
//  - Use PowerShell's Invoke-WebRequest -- requires PowerShell v3, which
//    doesn't come with Windows 7 by default
//  - Install <anything> -- defeats the purpose of a bootstrapping script
//  - Use "bitsadmin /transfer" -- couldn't get it to work, gives an ugly
//    warning that it'll be deprecated
//  - Use this VBScript I wrote

// I went with the third one, but I figured, "Why not JS?" It's supported by
// Windows Script Host after all. Boy, that was a mistake. WSH's JScript
// implementation is pre-ECMAScript 5. None of the nice new features, no
// Object.keys(), or even iterating over objects to see which properties they
// have.

function download(url, filename) {
	// http://stackoverflow.com/questions/4619088/windows-batch-file-file-download-from-a-url#answer-10403427
	// http://stackoverflow.com/questions/2973136/download-a-file-with-vbs/2973344#2973344

	// `new ActiveXObject` appears to be the JScript equivalent of vbscript's CreateObject
	var xmlHttpRequest = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
	xmlHttpRequest.open("GET", url);
	xmlHttpRequest.send()
    
    WScript.Echo("Downloading " + url + " to " + filename);

	var outputStream = new ActiveXObject("Adodb.Stream");
	outputStream.type = 1

	if (xmlHttpRequest.status === 200) {
		outputStream.open()
		outputStream.write(xmlHttpRequest.responseBody)
		outputStream.saveToFile(filename);

		WScript.Echo("Download complete.");
	}
	else {
		WScript.Echo("Error: HTTP Status = " + xmlHttpRequest.status);
	}
}

var url = WScript.Arguments(0);
var filename = WScript.Arguments(1);
download(url, filename);
