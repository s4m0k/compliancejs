(function( app ) {
	"use strict";
	
	function AnotherController ($rootScope,  $scope, $log, sharedService ) {
		$log.debug ('Emmitting changeTitle!');
		$rootScope.$broadcast ('changeTitle', ['New Title']);
		
		$scope.onItemClicked = function (index) {
			
		};
		
		
		function processData ( assets ) {
			
		
		}
			
		$scope.$on("$routeChangeSuccess", function () {
			$log.debug ("Route has been changed!");
			
		});
	}
	
})( angular.module ('app'));
