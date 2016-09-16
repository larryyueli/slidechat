app.controller("viewerController", ['$scope', '$http','$stateParams', function($scope, $http, $stateParams,$timeout){
 
    
    var uid = $stateParams.uid;
    
    getQuestions(uid); //get all questions

    
    $http.get('ajax/grabInfo.php?id='+$stateParams.uid).success(function(data){
     $scope.info = data;
       // console.log(data);
    }).error(function(){
        $scope.error = 1;
    });
    
    
    
    function getQuestions(uid){
    $http.get("ajax/getquestions.php?id="+uid).success(function(response){
        $scope.questions = response;
         MathJax.Hub.Queue(["Typeset",MathJax.Hub, "qs"]);
    });

    }
    
    $scope.showQuestion = function(){
        console.log("From showQuestion");
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