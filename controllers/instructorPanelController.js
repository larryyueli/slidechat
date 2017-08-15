app.controller("instructorPanelController", function($scope, $state, $http, AuthenticationService, $timeout) {
  //check if an instructor is logged in
  //if not kick them to the login page
  //If user is not logged in

  var token;
  if (localStorage['token']) {
    token = JSON.parse(localStorage['token']);
  } else {
    token = "-";
  }
  AuthenticationService.checkToken(token);

  //check if the user is an admin
  $scope.AdminLoggedIn = checkForAdminLogin(token);

  function checkForAdminLogin(tok) {
    var result = 0;
    $http.post('api/index.php/checkForAdmin', tok).success(function(response) {

      if (parseInt(response) == 1) {
        console.log("Admin logged in")
        $scope.AdminLoggedIn = response;
      };

    }).error(function(error) {

      console.log(error);
    });

  }

  reload();

  function reload() {

    //Table 1 get links of courses
    $http.post('api/index.php/panel', token).success(function(response) {
      //console.log(response);

      if (response != "empty") {
        $scope.nolinks = 0;
        $scope.showlinks = 1;
        $scope.links = response;
      } else {
        $scope.nolinks = 1;
        $scope.showlinks = 0;
      }
    });

  };

  $scope.switchBool = function(param) {
    if (param == "showFailureAlert") {
      $scope.showFailureAlert = 0;
    } else {
      $scope.showSuccessAlert = 0;
    }
  }

  $scope.CreateButtonMode = 1;

  $scope.openAddCourseForm = function() {
    $scope.addcourse = 1;
  }


  /******** upload functionality **********/
  $scope.DocUpload = function(event) {
    var files = event.target.files; //Filelist object
    var file = files[files.length - 1];
    $scope.file = file;

    //check if the the type is correct
    if (file.type != "application/pdf") {
      $scope.showFailureAlert = 1;
      $scope.FailureTextAlert = "Only pdf files are allowed";
      $scope.CreateButtonMode = 1;
    } else {
      $scope.CreateButtonMode = 0;
      if ($scope.showFailureAlert == 1) {
        $scope.showFailureAlert = 0;
      }
      var reader = new FileReader();
      reader.onload = $scope.DocIsLoaded;
      reader.readAsDataURL(file);
    }

  }

  $scope.DoIsLoaded = function(e) {
    $scope.$apply(function() {
      $scope.step = e.target.result;
    });
  }
  $scope.UploadInfo = {
    courseName: undefined,
    f: undefined
  }

  $scope.saveId = function(param) {
    $scope.pid = param;
  }

  $scope.isProcessing = false;

  $scope.createCourse = function(param) {
    // console.log(param);

    $scope.isProcessing = true;
    var fd = new FormData();
    angular.forEach($scope.files, function(file) {

      fd.append('file', file);

    });


    var request = $http({
      method: 'POST',
      url: 'api/index.php/uploadfile',
      data: fd,
      transformRequest: angular.identity,
      headers: {
        'Content-Type': undefined
      }
    });

    request.then(function(response) {
      $scope.isProcessing = false;
      console.log(response);
      var files = document.getElementById('exampleInputFile').files[0];
      console.log(response);

      var bab = {
        courseName: $scope.UploadInfo.courseName,
        fileName: files.name,
        userToken: token,
        pid: $scope.pid
      }

      $http.post('api/index.php/addmaterial', bab).success(function(response) {
        console.log(response);
        $scope.showSMaterialAlert = 1
        $scope.successTextAlert = "The course " + bab.courseName + " was created successfully.";

      }).error(function(error) {
        //console.log("error happened");
      });

    }, function(error) {

      $scope.msg = error.data;
      $scope.isProcessing = false;
      $scope.alert();
    });
  }

  $scope.alert = function() {

    $scope.showMsg = true;
    $timeout(function() {
      $scope.showMsg = false;
    }, 3000);
  }

  //material list
  $scope.showMaterial = 0;

  /********* upload functionality end **********/

  //Create new course
  $scope.addCourse = function() {
    var data = {
      courseN: $scope.courseN,
      tok: token
    }
    console.log(data)
    $http.post('api/index.php/addcourse', data).success(function(response) {
      location.reload();
      console.log(response)
    }).error(function(error) {
      console.log(error);
    });
  }

  $scope.deleteCourse = function(link) {
    var data = {
      tok: token['token'],
      link: link
    }
    $http.post('api/index.php/deletecourse', data).success(function(response) {
      console.log(data);
      console.log(response);
      if (response['sucess'] == true) {
        $scope.showMaterial = 0;
        reload();
        $scope.showSuccessAlert = 1;
        $scope.successTextAlert = "The course has been deleted successfully!";
      }
    });
  }

  $scope.deleteMaterial = function(id) {
    console.log("delete material")
    var data = {
      did: id
    }
    $http.post('api/index.php/deletematerial', data).success(function(response) {
      console.log(response)
      if (response['success'] == true) {
        reload();
        $scope.showSuccessAlert = 1;
        $scope.successTextAlert = "The item has been deleted successfully!";
      }
    });
  }

  //Table 1 get links of courses
  $http.post('api/index.php/panel', token).success(function(response) {

    if (response != "empty") {
      $scope.nolinks = 0;
      $scope.showlinks = 1;
      $scope.dat = response.course;
      $scope.mats = response.materials;
      $scope.links = response.course;
    } else {
      $scope.nolinks = 1;
      $scope.showlinks = 0;
    }
  });


  //Logout functionaility
  $scope.logMeOut = function() {
    var data = {
      token: token
    }
    $http.post('api/index.php/logout', data).success(function(response) {
      localStorage.clear();
      $state.go("login");
    }).error(function(error) {
      console.error(error);
    })
  }


});
