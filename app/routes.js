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
    }).state('viewer', {
        url: '/viewer/:uid'
        , templateUrl: 'templates/viewer/index.html'
        , controller: 'viewerController'
    }).state('feedback', {
        url: '/feedback'
        , templateUrl: 'templates/feedback/index.html'
    });
});