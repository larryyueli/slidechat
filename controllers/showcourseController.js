app.controller("showcourseController", ['$scope', '$http','$routeParams', function($scope, $http, $routeParams){
    $http.get('ajax/showcourse.php?id='+$routeParams.id).success(function(data){
     $scope.courses = data;
    }).error(function(){
        $scope.error = 1;
    });
}]);