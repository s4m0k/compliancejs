(function( app ) {
	"use strict";
	
	function AnotherController ($rootScope,  $scope, $log, sharedService, assetFactory ) {
		$log.debug ('Emmitting changeTitle to Valuation');
		$rootScope.$broadcast ('changeTitle', ['Valuation']);
		
		$scope.onItemClicked = function (index) {
			
		};
		
		
		function processData ( assets ) {
			
		
		}
			
		$scope.$on("$routeChangeSuccess", function () {
			$log.debug ("Route has been changed!");
			
		});
	}
	
})( angular.module ('app'));
