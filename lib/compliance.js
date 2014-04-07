/**
 * ComplianceJS Alpha 1.0
 * By s4m0k
 * 2014-04-04
 *
 */



var start = new Date().getTime();
var fs = require ( 'fs-extra' );
var path = require ('path');
var glob = require ('glob');
var clc = require ('cli-color');
var ncp = require ( 'ncp').ncp;
var UTF8 = 'utf8';
var DEFAULT_RULES_PATH = "rules";
var RULE_EXT_NAME = ".json";
var CONFIG_FILE = "compliance-config.json";


var Logger = {};
Logger.debug = function ( msg ) {
    console.log ( "[DEBUG] " + msg );
};

Logger.info = function ( msg ) {
    console.debug ( "[INFO ] " + msg );
};

Logger.error = function ( msg ) {
    console.error ( "[ERROR] " + msg );
};



var rules = [];
var config;
config = require ("." + path.sep + CONFIG_FILE);




function initializeRules () {
    var getAllRuleFiles = function (dir, goDeep) {
        
        var out = [];
        var files = fs.readdirSync (dir);
    
        for ( var index in files ) {
            var f = files[index];
            
            
                var fStat = fs.statSync (dir + path.sep + f);
                
                if (fStat.isFile() ) {
                    var extName = path.extname ( f );
        
            
                    if ( extName && (extName.toLowerCase() === RULE_EXT_NAME)) {
                        out.push ( dir + path.sep + f);
                    }
                } else if ( fStat.isDirectory() && goDeep ) {
                    // do a recursive call
                    var out2 = getAllRuleFiles( dir + path.sep + f, goDeep);
                    if ( out2 && out2.length > 0) {
                        for ( var i in out2 ) {
                            out.push ( out2 [i] );
                        }
                    }
                }
        }        
        return out;
    };
    
    
    var isRuleExcluded = function (config, name, rule) {
        var exRules = config.exclude;
        for ( var key in exRules )  {
            if ( key === name) {
                var exArr = exRules[key];
                if ( exArr && exArr.length > 0) {
                    for ( var index in exArr) {
                        var value = exArr[index];
                        if ( value === rule.id ) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    };
    
    
    var ruleFiles = getAllRuleFiles(DEFAULT_RULES_PATH, true);
    
    
    if ( ruleFiles && ruleFiles.length > 0 ) {
        for ( var i in  ruleFiles )  {
            try {
                var rFilePath = ruleFiles [ i ];
                var json = require ("." + path.sep + rFilePath);
                
                if ( json === undefined )
                    continue;
                
                var objRules = json.rules;
                
               
                
                if ( objRules.length === undefined ) {
                    var excluded = isRuleExcluded( config, json.name, objRules );
                    if ( excluded )
                        continue;
                    
                    if ( objRules.pattern === undefined )
                        continue;
                    
                    var newObj = {};
                    if ( typeof  objRules.flags  === "undefined" ) {
                            newObj.flags = "g";
                    } else 
                        newObj.flags = objRules.flags;
                    
                    newObj.message = objRules.message;
                    newObj.pattern = new RegExp (objRules.pattern, newObj.flags);
                    rules.push ( newObj );
                } else if ( objRules.length > 0 ) {
                    for ( var index in objRules ) {
                        var j = objRules [index];
                        
                        if ( j.pattern === undefined )
                            continue;
                        
                        
                        var excluded = isRuleExcluded( config, json.name, j);
                        if ( excluded )
                            continue;
                        
                        var rObj = {};
                        rObj.message = j.message;
                        if ( typeof j.flags  === "undefined" ) {
                            rObj.flags = "g";
                        } else {
                            rObj.flags = j.flags;
                        }
                            
                        rObj.pattern = new RegExp (j.pattern, rObj.flags);
                        rules.push ( rObj );
                    }
                }
                
                
            } catch ( err ) {
                console.warn  ( clc.yellow ( "[WARN] " + err ) );
            }
        }
    
    }
    
    
    console.log ( clc.green ("[INFO] " + rules.length + " rule(s) loaded." ));
}

config = require ("." + path.sep + CONFIG_FILE);
initializeRules();



var files = config.files;
var issues = [];

var getPosition = function ( tokens, charIndex) {
    var runningLength = 0;
    var out = {};
    var tokLen = tokens.length;
    
    
    for ( var lineNumber = 0; lineNumber < tokLen; lineNumber ++) {
        var lineStr = tokens[lineNumber];
        var lineLen = lineStr.length;
        runningLength += (lineLen + 1);
        
        // found
        if ( runningLength >= charIndex ) {
    
            
            out.line = lineNumber + 1;
            out.column = (charIndex - (runningLength - lineLen)) + 2; 
            return out;
        }
    }
        
    return undefined;
};

var processFile = function (filename) {
    Logger.debug ( "Processing file " + filename);
    
    var content = fs.readFileSync (filename, {encoding : UTF8});
    
    var tokens = content.split ("\n");
    
    for ( var index  in rules ) {
        var rule = rules [ index ];
        var match ;
        
        while ( (match = rule.pattern.exec ( content )) != null) {
            var issue = {};
            issue.file = filename;
            issue.message = rule.message;
            var pos = getPosition (tokens, match.index);
            if ( pos !== undefined ) {
                issue.line = pos.line;
                issue.column  = pos.column;
            }
            
            
            issue.code = match[0];
            issues.push ( issue );
        }
    }
};

if ( (typeof files ) === "string" ) {
    processFile ( files );
} else if ( files.length > 0 ) {
    for ( var index in config.files ) {
        var f = config.files [ index ];
        var srcs = glob.sync (f);
        for ( var i in srcs ) {
            processFile ( srcs [i] );
        }
    }
}

var showConsoleReport = function ( issues ) {
    
    for ( var index in issues ) {
        var issue = issues [ index ];
        console.log ( issue.file + " @ line " + issue.line +", column " + issue.column);
        console.log ("\t" + issue.message);
        console.log (clc.red ( "\t" + issue.code + "\n") );
    }
};


// generate reports here

if ( config.reports && config.reports.length > 0) {
    var replacePlaceholder = function ( pathDest, pathSrc, phRegex, callback) {
        
        fs.readFile(pathDest, 'utf8', function (err,data) {
          if (err) {
            return console.log(err);
          }
            
            fs.readFile(pathSrc, 'utf8', function ( err2, data2) {
                var result = data.replace(phRegex, data2);      
                fs.writeFile(path.sep + pathDest, result, 'utf8', function (err) {
                    if (err) return console.log(err);
                    
                    
                    if ( callback !== null && callback !== undefined )  {
        
                        callback ();
                    }
                });
            });
            
        });
    };
    
    /* Write JSON Object to a file to be consumed by reports */
    var issuesJS = __dirname + path.sep + 'issues.js';
    fs.writeFile ( issuesJS, "var g_totalRules=" + rules.length+ ";var g_issues = " + JSON.stringify( issues ) + ";", 'utf8', function ( err ) {
        if ( err )
            throw err;
    });
    
    
    var removeFolder = function(path) {
        var files = [];
        if( fs.existsSync(path) ) {
            files = fs.readdirSync(path);
            files.forEach(function(file,index){
                var curPath = path + "/" + file;
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                    removeFolder(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };
    
    // delete reports folder
    
    for ( var index in config.reports ) {
        
        var repConf = config.reports [ index ];
        
        // check if folder exists
        if ( fs.existsSync ( repConf.dist ) ) {
            // delete it
            removeFolder ( repConf.dist );
        }
        
        fs.mkdir ( repConf.dist );
        
        
        var outputRoot = __dirname + path.sep + repConf.dist + path.sep + repConf.type + "-" + repConf.template;
     
        console.log ('Output root is  [' + outputRoot + ']');
        if ( !fs.existsSync ( outputRoot ) ) {
        
            fs.mkdir ( outputRoot );
        }
        
        // copy index
        
        
        console.log ("Copying [" + issuesJS + "] to " + outputRoot + path.sep + "js" + path.sep + "issues.js");
        fs.copy(issuesJS, outputRoot + path.sep + "js" + path.sep + "issues.js", function (err) {
          if (err) {
              console.log ("An Error occured!" + err);
              
            throw err;
          }
        
        });
                    
                    
        ncp ('templates/resources', outputRoot, function ( err ) {
            if ( err ) {
                console.error ( err );
                throw err;
            }
            
            ncp ('templates/' + repConf.template, outputRoot , function ( err ) {
                if ( err ) {
                    console.error ( err );
                    throw err;
                }
                
                replacePlaceholder ( outputRoot + "/index.html", outputRoot + "/report.html", /\$\{report\.html\}/g, function () {
                    replacePlaceholder ( outputRoot + "/index.html", outputRoot + "/summary.html", /\$\{summary\.html\}/g);
                });         
            });    
        } );
        
        
        
    }
}




showConsoleReport ( issues );







var end = new Date().getTime();


console.log ("Compliance checking finished in " + (end - start) + "ms\n");
console.log (clc.magenta ("\nThere are " + issues.length + " issue(s) found.\n"));


