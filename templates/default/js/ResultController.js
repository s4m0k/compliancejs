angular.module ("app").controller ("ResultController", function ($scope, $http) {

    $scope.files = [];
    var findObjectByPath = function ( path ) {
        for ( var index in $scope.files ) {
            var f = $scope.files [index];
            if ( f.path === path )
                return f;
        }
        
        return null;
    };
    for ( var index in g_issues ) {
        var iss = g_issues [ index ];
        
        console.log ('Processing ' + JSON.stringify ( iss.file ));
        
        var fObj = findObjectByPath ( iss.file );
        if ( fObj === null ) {
            fObj = {};
            fObj.path = iss.file;
            fObj.issues = [];
            $scope.files.push ( fObj );
        }
        
        var issObj = {};
        issObj.line = iss.line;
        issObj.column = iss.column;
        issObj.description = iss.message;
        issObj.source = iss.code;
        
        
        fObj.issues.push ( issObj );
        
    }

});