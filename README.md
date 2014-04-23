#ComplianceJS

JavaScript coding best practices validator written with NodeJS.

##Status

Version 0.0.9

##Features

- Write your own rules
- Write your own plugins
- Write your own report templates

##Install

    npm install -g compliancejs

## Dependencies

- [NodeJS] (http://nodejs.org/)
- [cli-color] (https://github.com/medikoo/cli-color)
- [node-glob] (https://github.com/isaacs/node-glob)
- [fs-extra] (https://github.com/jprichardson/node-fs-extra)

##Usage

    compliance [--config=config-file]

--config  is an optional parameter where compliance options are configured.  If --config is not present, the application will look for compliance-config.json in the directory where the command was issued.




##Configuration

Configuration is JSON formatted text file with the following table of keys.

Key           | Value Type           |  Required | Default | Description
------------- | ---------------------|-----------|---------| -----------
files         | Array of String      | Yes       |         | This is an array of path pointing to the files that needs to be validated. You can use abosulte or glob pattern for the filename.
reports       | Array of JSON Object | No        |         | Reports configuration
ignoreRuleFileError | boolean | No|true|If set to false, ComplianceJS will stop and throw exception when error is detected from rule files.
exclude | JSON Object | No | | Exclude some rules from being validated against the files configured in "files".
rules | Array of String | No | rules/** | An array of path pointing to the files that contains the rule definition.  Values can be absolute or glob pattern.
plugins | Array of String | No | plugins/** | An array of path pointing to the files that contains plugin codes. Values can be absolute or glob pattern.

###Key "reports"

Key | Value Type | Required | Default | Description
--- |  ----------|  --------|   -------|   -----------
template | String | Yes | | Report template name
type | String | Yes | | Report format.  Supports the following values : html or text
dist | String | Yes | | The path to where the reports will be generated.

###Key "exclude"

Key | Value Type | Required | Default | Description 
----| -----------|----------|---------|------------
[Rule Collection Name] | Array of String | Yes | | Key is dynamic and must be the rule collection name defined in the rule file.  The values for this key must be the name or id of the rule that needs to be excluded.

###Configuration File Example
compliance-config.json
``` JavaScript
{
    
    "plugins" : [
      "plugins/**/*.js"
    ],
    
    "rules" : [
      "rules"
    ],
    
    "exclude" : {
        "Basic" : ["eqeqeq"]
    },
    
    "files" : [
        "test/**/*.js"
    ],
    
    "reports" : [
        {
            "template" : "default",
            "type"  : "html",
            "dist" : "reports"
        }
    ], 
    
    "ignoreRuleFileError" : true,
    
    "overrides" : [
        {
            "group" : "Basic", 
            "id" : "maxComplexity",
            "param" : {"max" : 8}
        }
    ]
}
```

##How to create and add your custom rules?

See [Writing Custom Rules] (https://github.com/s4m0k/compliancejs/wiki/Rules)

##How to create and add your own plugins?

##Report Template
