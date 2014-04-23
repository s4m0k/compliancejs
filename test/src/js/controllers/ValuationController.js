(function( app ) {
	"use strict";
	
	function ValuationController ($rootScope,  $scope, $log, sharedService, assetFactory ) {
		$log.debug ('Emmitting changeTitle to Valuation');
		$rootScope.$broadcast ('changeTitle', ['Valuation']);
		
		$scope.onItemClicked = function (index) {
			WL.Logger.debug ("Index clicked is " + index);
			var clickedAsset = $scope.assets [ index ];
			if (clickedAsset.disabled) {
				WL.Logger.debug ("Asset clicked is disabled.  Returning now!");
				return;
			}
			
			if ( clickedAsset !== $scope.selectedAsset ) {
				$scope.selectedAsset.selected = false;
				clickedAsset.selected = true;
				$scope.selectedAsset = clickedAsset;
				sharedService.selectedAsset = clickedAsset;
			} 
		};
		
		
		function processData ( assets ) {
			$scope.assets = assets;
			
			
			$scope.assetTotal = 0;
			var arr = [];
			for ( var index in $scope.assets) {
				var asset  = $scope.assets[index];
				asset.index = index;
				
				if (asset.pct == 0) {
					asset.disabled = true;
				}
				
				arr.push ( asset.pct );
				$scope.assetTotal += asset.value;
			};
		
		}
		
		
		$scope.$on("$routeChangeSuccess", function () {
			WL.Logger.info ("Route has been changed!");
			
			if ( !sharedService.assets ) {
				assetFactory.getAssets().then (function ( data ) {
					WL.Logger.debug("Data has arrived! Processing data");
					sharedService.assets = data.assets;
					sharedService.selectedAsset = data.assets[0];
					sharedService.selectedAsset.selected = true;
					$scope.selectedAsset = sharedService.selectedAsset;
					processData ( data.assets );
				});
			} else {
				
				$scope.selectedAsset = sharedService.selectedAsset;
				processData ( sharedService.assets );
			}
			
		});
	}
	app.controller ('ValuationController', ValuationController);
    
    app.controller ('WrongController',          function() {
        //lalalala
    });
	
	
})( angular.module ('app'));