app.controller("showcourseController", ['$scope', '$http','$stateParams', function($scope, $http, $stateParams){
    
    $http.get('ajax/showcourse.php?id='+$stateParams.courseToken).success(function(data){
     $scope.courses = data;
        console.log(data);
    }).error(function(){
        $scope.error = 1;
    });
    
    
    
    
    
    
    
    
}]);