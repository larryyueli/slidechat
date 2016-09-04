angular.module('slidechat')
    .config(function($routeProvider){
    $routeProvider.when('/course/:id',{
        templateUrl: 'templates/course/index.html',
        controller: 'showcourseController'
    }).when('/',{
        templateUrl: 'templates/instructor/index.html'
    }).when('/admin',{
        templateUrl: 'templates/admin'
    }).otherwise({
        templateUrl:'templates/errors/404.html'
    });
 
});