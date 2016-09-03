angular.module('slidechat')
    .config(function($routeProvider){
    $routeProvider.when('/course/:id',{
        templateUrl: 'templates/course/index.html',
        controller: 'showcourseController'
    }).when('/',{
        templateUrl: 'templates/login/index.html'
    }).otherwise({
        templateUrl:'templates/errors/404.html'
    });
 
});