app.controller("viewerController", ['$scope', '$http', '$stateParams', '$sce', function ($scope, $http, $stateParams, $sce) {
    
    var uid = $stateParams.uid;
    $scope.pageadress = uid;
//    
//    $scope.postQuestion = function () {
//            var username = "";
//            if ($scope.pname == undefined) {
//                username = "anonymous";
//            }
//            else {
//                username = $scope.pname;
//            }
//            var data = {
//                name: username
//                , question: $scope.quest
//                , tok: uid
//        
//            }
//            $http.post("ajax/addquestion.php", data).success(function (response) {
//                $scope.ci = response;
//                location.reload();
//                $scope.pname = "";
//                $scope.quest = "";
//            }).error(function (error) {
//                console.log("error: " + erorr);
//            });
//        }
//    
    
    /************* pdf stuff ********************/
    loadPdf();
    /************** end pdf stuff *******************/
    function loadPdf(link) {
        $scope.pdfUrl = link;
        $scope.scroll = 0;
        $scope.loading = 'loading';
        $scope.getNavStyle = function (scroll) {
            if (scroll > 100) return 'pdf-controls fixed';
            else return 'pdf-controls';
        }
        $scope.onError = function (error) {
            console.log(error);
        }
        $scope.onLoad = function () {
            $scope.loading = '';
        }
        $scope.onProgress = function (progress) {
            //console.log(progress);
        }
    }
    $http.get('ajax/grabInfo.php?id=' + $stateParams.uid).success(function (data) {
        loadPdf(data[0].filepath);
        $scope.s = data;
        $scope.downloadlink = data[0].filepath;
        $scope.filena = data[0].filepath.replace(".pdf", "").replace("slides/", "");
    }).error(function () {
        $scope.error = 1;
    });
    $scope.postAnswer = function (answer, id) {
        var data = {
            answer: answer
            , unqiueId: uid
            , id: id
        }
        $http.post('ajax/addAnswer.php', data).success(function (response) {
            console.log(response);
            $scope.getQuestions(uid); //get all questions  
        });
    }
}]);