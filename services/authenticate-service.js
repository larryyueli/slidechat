app.service('AuthenticationService', ["$http", "$state", function ($http, $state) {
    var self = this;
    self.checkToken = function (token) {
        var data = {
            token: token
        };
        $http.post("api/index.php/checktoken", data).success(function (response) {
            if (response === "unauthorized") {
                console.log("Logged out");
                $state.go("login")
            }
            else {
                return response;
            }
        }).error(function (error) {
            $state.go("login")
        })
    }
}]);
