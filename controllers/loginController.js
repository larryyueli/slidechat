app.controller('loginController', function ($scope, $http, $state) {
    $scope.loginInfo = {
        email: undefined
        , password: undefined
    }
    $scope.logMeIn = function () {
        var data = {
            email: $scope.loginInfo.email
            , password: $scope.loginInfo.password
        }

        console.log(data)

        $http.post('api/index.php/login', data).success(function (response) {
            localStorage.setItem("token", JSON.stringify(response));
            console.log(localStorage);
            $state.go("ipanel");
        }).error(function (error) {
            console.log(error);
        });
    }
});
