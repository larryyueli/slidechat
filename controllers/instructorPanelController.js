app.controller("instructorPanelController", function ($scope, $state, $http, AuthenticationService) {
    //check if an instructor is logged in
    //if not kick them to the login page
    //If user is not logged in
    var token;
    if (localStorage['token']) {
        token = JSON.parse(localStorage['token']);
    }
    else {
        token = "-";
    }
    AuthenticationService.checkToken(token);
    $scope.logMeOut = function () {
        var data = {
            token: token
        }
        $http.post('ajax/logout.php', data).success(function (response) {
            localStorage.clear();
            $state.go("login");
        }).error(function (error) {
            console.error(error);
        })
    }
});