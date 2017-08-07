angular.module('slidechat').config(function($stateProvider) {
  $stateProvider.state("login", {
    url: '/',
    templateUrl: 'templates/index.html'
  }).state("ipanel", {
    url: "/panel",
    templateUrl: "templates/instructor/panel.html",
    controller: 'instructorPanelController'
  }).state('index', {
    url: "",
    templateUrl: 'templates/index.html'
  }).state('viewer', {
    url: '/viewer/:uid',
    templateUrl: 'templates/viewer/index.html',
    controller: 'viewerController'
  }).state("instructor", {
    url: "/instructor",
    controller: 'loginController',
    templateUrl: 'templates/instructor/index.html'
  })
});
