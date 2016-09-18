app.controller("viewerController", ['$scope', '$http','$stateParams', function($scope, $http, $stateParams,$timeout){

  
    
  /************* pdf stuff ********************/
  
   loadPdf();
  
  /************** end pdf stuff *******************/


    var uid = $stateParams.uid;
    
    getQuestions(uid); //get all questions

    
    function loadPdf(link){
        //$scope.pdfName = 'Relativity: The Special and General Theory by Albert Einstein';
  $scope.pdfUrl = link;
  $scope.scroll = 0;
  $scope.loading = 'loading';

  $scope.getNavStyle = function(scroll) {
    if(scroll > 100) return 'pdf-controls fixed';
    else return 'pdf-controls';
  }

  $scope.onError = function(error) {
    console.log(error);
  }

  $scope.onLoad = function() {
    $scope.loading = '';
  }

  $scope.onProgress = function(progress) {
    //console.log(progress);
  }
  
  
    }
    
    
    $http.get('ajax/grabInfo.php?id='+$stateParams.uid).success(function(data){
        loadPdf(data[0].filepath);
    
    }).error(function(){
        $scope.error = 1;
    });
    
    
    
    function getQuestions(uid){
    $http.get("ajax/getquestions.php?id="+uid).success(function(response){
        
        $scope.questions = response;
         MathJax.Hub.Queue(["Typeset",MathJax.Hub, "qs"]);
    });

    }
  
    
    
    $scope.postQuestion = function(){
        
        var username = "";
        
        if($scope.pname == undefined){
            username = "anonymous";
        }
        else{
            username = $scope.pname;
        }
        
        
        var data = {
            name : username,
            comment: $scope.comment,
            tok: uid
        }
        
        
        $http.post("ajax/addquestion.php", data).success(function(response){
            $scope.ci = response;
            getQuestions(uid);
            $scope.pname = "";
            $scope.comment = "";
            //alert("The question has been added");
        }).error(function(error){
            console.log("error: "+erorr);
        });
    }
    
    
    
    
    
    
    
    
}]);