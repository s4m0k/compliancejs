#ComplianceJS

JavaScript coding best practices validator written with NodeJS.

##Status

Version Alpha 1 Unstable

##Features

- Write your own rules
- Write your own plugins
- Write your own report templates

##Install

Just checkout the codes.

This will be published soon in NPM.

## Dependencies

- http://nodejs.org/
- https://github.com/medikoo/cli-color
- https://github.com/isaacs/node-glob
- https://github.com/jprichardson/node-fs-extra

##Usage


``` 
node compliance [--config=config-file]
```
--config  is an optional parameter where compliance options are configured.  If --config is not present, the application will look for compliance-config.json in the directory where the command was issued.




Configuration
-------------

``` JavaScript
