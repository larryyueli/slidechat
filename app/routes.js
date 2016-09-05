angular.module('slidechat').config(function ($stateProvider) {
    $stateProvider.state("login", {
        url: '/'
        , controller: 'loginController'
        , templateUrl: 'templates/instructor/index.html'
    }).state("ipanel", {
        url: "/panel"
        , templateUrl: "templates/instructor/panel.html"
        , controller: 'instructorPanelController'
    });
});
/****
 $stateProvider.when('/course/:id', {
        templateUrl: 'templates/course/index.html'
        , controller: 'showcourseController'
    }).when('/', {
        templateUrl: 'templates/instructor/index.html'
    }).when('/admin', {
        templateUrl: 'templates/admin'
    }).when('/instructor', {
        templateUrl: 'templates/instructor/panel.html'
        , controller: 'instructorPanelController'
    }).otherwise({
        templateUrl: 'templates/errors/404.html'
    });
    */