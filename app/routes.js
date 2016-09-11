angular.module('slidechat').config(function ($stateProvider) {
    $stateProvider.state("login", {
        url: '/'
        , controller: 'loginController'
        , templateUrl: 'templates/instructor/index.html'
    }).state("ipanel", {
        url: "/panel"
        , templateUrl: "templates/instructor/panel.html"
        , controller: 'instructorPanelController'
    }).state('index', {
        url: ""
        , templateUrl: 'templates/instructor/index.html'
        , controller: 'loginController'
    }).state('course',{
        url: '/course/:courseToken',
        templateUrl: 'templates/course/index.html',
        controller:'showcourseController'
    });
});