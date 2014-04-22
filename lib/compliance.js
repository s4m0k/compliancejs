/**
 * ComplianceJS Alpha 1.0
 * By s4m0k
 * 2014-04-04
 *
 */


console.log ("Directory is [" +__dirname + "]");
(function() {



    var start = new Date().getTime();
    var fs = require ( 'fs-extra' );
    var path = require ('path');
    var glob = require ('glob');
    var clc = require ('cli-color');
    var ncp = require ( 'ncp').ncp;
    var UTF8 = 'utf8';
    var DEFAULT_RULES_PATH = path.normalize(__dirname + path.sep + ".." + path.sep + "rules");
        
    var RULE_EXT_NAME = ".json";
    var CONFIG_FILE =  process.cwd() + path.sep + "compliance-config.json";
    var rules = [];
    var config = require (CONFIG_FILE);
        
        
    
    var Logger = {};
    
    Logger.verbose = false;
        
        
    Logger.debug = function ( msg ) {
        if (Logger.verbose)
            console.log (clc.blackBright  ( "[DEBUG] " + msg ));
    };
    
    Logger.info = function ( msg ) {
        if (Logger.verbose)
            console.log (clc.green ( "[INFO ] " + msg ));
    }; 
    
    Logger.error = function ( msg ) {
        if (Logger.verbose)
            console.error (  clc.red ("[ERROR] " + msg ) );
    };
        
    Logger.warn = function ( msg ) {
        if (Logger.verbose)
            console.warn ( clc.yellow ( "[WARN ] " + msg ) );
    };
        
    
    
    
    
    var  initializeRules = function () {
        
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
        
        
        var ruleFiles = [];
    
        if (config.rules !== null && config.rules !== undefined && config.rules.length > 0) {
            if ( typeof config.rules ==="string") {
                var confRules = getAllRuleFiles(config.rules, true);
                ruleFiles.push.apply  (ruleFiles, confRules);
            } else {
                
                for (var index in config.rules ) {
                    var r = path.resolve(process.cwd(),  config.rules [index] );
                    
                    Logger.debug("Reading glob pattern! " + r);
                    
                    
                    var srcs = glob.sync ( r );
                    Logger.debug ( srcs.length );
                    for (var i in srcs) {
                        var src = srcs[i];
                        Logger.debug("Rule src [" + src + "]");
                        var confRules = getAllRuleFiles(src, true);
                        ruleFiles.push.apply  (ruleFiles, confRules);
                    }
                    
                }
            }
        
        }
        
        if (config.excludeDefaultRules === null || (typeof  config.excludeDefaultRules === "undefined")) {
            config.excludeDefaultRules = false;
        } else if ( config.excludeDefaultRules !== false && config.excludeDefaultRules !== true ) {
            
            console.log ("ExcludeDefaultRules is " + typeof (config.excludeDefaultRules) + " value [" + config.excludeDefaultRules + "]");
            throw "Invalid configuration value for excludeDefaultRules";
        }
        
        console.log ("Trace here!");
        if (config.excludeDefaultRules === false) {
            var defRules = getAllRuleFiles(DEFAULT_RULES_PATH, true);
            ruleFiles.push.apply  (ruleFiles, defRules);
        }
        
        
        Logger.debug("RuleFiles count [" + ruleFiles.length + "]");
        if ( ruleFiles && ruleFiles.length > 0 ) {
            for ( var i in  ruleFiles )  {
                try {
                    var rFilePath = ruleFiles [ i ];
                    var json = require (rFilePath);
                    
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
        
        
        Logger.info (rules.length + " rule(s) loaded.");
    };
    
    
    
    
    
    
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
    
    
    
    var showConsoleReport = function ( issues ) {
        
        for ( var index in issues ) {
            var issue = issues [ index ];
            console.log ( issue.file + " @ line " + issue.line +", column " + issue.column);
            console.log ("\t" + issue.message);
            console.log (clc.red ( "\t" + issue.code + "\n") );
        }
    };
    
    
    // generate reports here
    
    var generateReport = function () {
    
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
            var issuesJS = process.cwd() + path.sep + 'issues.js';
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
                if ( fs.existsSync ( path.resolve (process.cwd(), repConf.dist ) )) {
                    // delete it
                    removeFolder ( repConf.dist );
                }
                
                fs.mkdir ( repConf.dist );
                
                
                var outputRoot = path.resolve (process.cwd(), repConf.dist + path.sep + repConf.type + "-" + repConf.template);
             
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
                            
                            
                ncp (path.resolve ( process.cwd(), 'templates' + path.sep + 'resources'), outputRoot, function ( err ) {
                    if ( err ) {
                        console.error ( err );
                        throw err;
                    }
                    
                    ncp (path.resolve (process.cwd(), 'templates' + path.sep + repConf.template) , outputRoot , function ( err ) {
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
    };
    
    
    
    
    
    var validateCompliance = function () {
        
        if ( (typeof files ) === "string" ) {
            processFile ( path.resolve (process.cwd(), files) );
        } else if ( files.length > 0 ) {
            for ( var index in config.files ) {
                var f = config.files [ index ];
                var srcs = glob.sync (f);
                for ( var i in srcs ) {
                    processFile ( path.resolve(process.cwd(),  srcs [i] ));
                }
            }
        }
    
    };
    
    
    
    
    
    
    
    
    
    var validArgs = [
        {
            "name" : "--config",
            "explicit" : true
        },
        
        {
            "name" : "--verbose",
            "explicit" : false
        }
    ];
        
    var getArgConfig = function (key) {
        // check if key has = or =value
        
        if ( key.indexOf("=") != -1 ) {
            key = key.split ("=")[0].trim();
        }
        
        
        
        
        for (var index in validArgs ) {
            var argConfig = validArgs[index];
            if ( argConfig === null )
                continue;
            
            if (argConfig.name === key )
                return argConfig;
            
        }
        
        return null;
    };
        
    var parseArguments = function  ( args, callback ) {
        
        console.log ("parseArgument method has been invoked!");
        args.splice (0, 2);
        
        if ( args.length == 0 ) {
            callback (undefined, {});
        } else {
            
            var EXPECT_KEY = 1;
            var EXPECT_EQUAL = 2;
            var EXPECT_VALUE = 3;
            
            
            var expectKey = true;
            var expectValue = false;
            var expectEquals = false;
            
            
            var expectedToken = EXPECT_KEY;
            
            var argObj = {};
            
            var outObj = {};
            
            for ( var index in args ) {
                var token = args[index].trim();
                
                if ( expectedToken === EXPECT_KEY ) {
                    // check if valid key
                    var argConfig = getArgConfig ( token );
                    if (argConfig === null) {
                        callback ( {
                            "code" : 1,
                            "message" : "Invalid argument - (" + token + ")"
                        });
                    } 
                    
                    
                    // check if  has = or = and space
                    
                    if ( token.indexOf("=") != -1) {
                        // split it
                        
                        var tokArr = token.split ("=");
                        
                        
                        console.log ("-====>>>>" + JSON.stringify(tokArr));
                        argObj.key = tokArr[0].trim();
                        argObj.value = tokArr[1].trim();
                        
                        outObj[argObj.key] = argObj.value;
                        argObj = {};
                        
                        expectedToken = EXPECT_KEY;
                        
                    } else {
                        argObj.key = token;
                        
                        if ( !argConfig.explicit ) {
                            argObj.value = true;
                            outObj[argObj.key] = argObj.value;
                            argObj = {};
                            expectedToken = EXPECT_KEY;
                        } else
                            expectedToken = EXPECT_EQUAL;
                    }
                } else if ( expectedToken === EXPECT_EQUAL )  {
                    // check if has equals
                    
                    if ( token.indexOf("=") === -1 )  {
                        callback ( {
                            "code" : 2,
                            "message" : "Equal sign is expected after " + argObj.key
                        });
                    } else {
                        if ( token.length === 1 ) {
                            
                            expectedToken = EXPECT_VALUE;
                            
                        } else {
                            var tokArr = token.split ("=");
                            argObj.value = tokArr[1].trim();
                            
                            outObj[argObj.key] = argObj.value;
                            argObj = {};
                            expectedToken = EXPECT_KEY;
                            
                        }
                    
                    }
                
                } else if ( expectedToken === EXPECT_VALUE ) {
                    argObj.value = token;
                    outObj[argObj.key] = argObj.value;
                    argObj = {};
                    
                }
                
            }
        
        }
        callback ( undefined, outObj);
    };
        
    
    
    
    
    exports.check  = function ( ) {
        console.log ("Parsing arguments!");
        
        try {
        
        
        
            parseArguments(process.argv, function ( err, args) {
                if ( err ) {

                    console.log ("Error : " + JSON.stringify ( err ) );

                    throw{ 
                        name:        "Application Error", 
                        level:       "Error", 
                        message:     err.message, 
                        htmlMessage: err.message,
                        toString:    function(){return JSON.stringify (err)} 
                    }; 
                }

                console.log ( args );


                if ( args["--verbose"] === true ) {
                    console.log ("Setting verbose to true!");
                    Logger.verbose = true;
                }


                Logger.info ("Process CWD   : " + process.cwd());
                Logger.info ("Default Rules : " + DEFAULT_RULES_PATH);

                Logger.debug("Config : " + JSON.stringify ( config ) );

                Logger.debug("Loading rules...");
                initializeRules();

                Logger.debug("Validating compliance...");
                validateCompliance();
                generateReport();
                showConsoleReport ( issues );

                var end = new Date().getTime();
                Logger.info ("Compliance checking finished in " + (end - start) + "ms\n");
                Logger.info ("\nThere are " + issues.length + " issue(s) found.\n");

            });

        } catch ( err ) {
            Logger.error ( err );
        }
    };
})();
