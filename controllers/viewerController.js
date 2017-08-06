app.controller("viewerController", ['$scope', '$http', '$stateParams', '$sce', function ($scope, $http, $stateParams, $sce) {

    var uid = $stateParams.uid;

    $scope.pageadress = uid;


    $scope.to_trusted = function(html_code) {
    return $sce.trustAsHtml(html_code);
    }


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
    var data = {
      id: $stateParams.uid
    }
    console.log(data)
    $http.post('api/index.php/viewer',data).success(function (data) {
      console.log(data)
        loadPdf(data[0].filepath);
        $scope.s = data;
        $scope.downloadlink = data[0].filepath;
        $scope.filena = data[0].filepath.replace(".pdf", "").replace("slides/", "");
    }).error(function () {
        $scope.error = 1;
    });

}]);
