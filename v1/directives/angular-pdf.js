/*! Angular-PDF Version: 1.3.0 | Released under an MIT license */
/*
Modified by Arjun Dhiman. 2016 - present
arjun.dhiman@mail.utoronto.ca
All modifications are free to use.
*/
(function() {

  'use strict';

  angular.module('pdf', []).directive('ngPdf', [ '$window','$http', function($window,$http) {
    var renderTask = null;
    var pdfLoaderTask = null;
    var debug = false;

    var backingScale = function(canvas) {
      var ctx = canvas.getContext('2d');
      var dpr = window.devicePixelRatio || 1;
      var bsr = ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1;

      return dpr / bsr;
    };

    var setCanvasDimensions = function(canvas, w, h) {
      var ratio = backingScale(canvas);
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = Math.floor(w) + 'px';
      canvas.style.height = Math.floor(h) + 'px';
      canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
      return canvas;
    };
    return {
      restrict: 'E',
      templateUrl: function(element, attr) {
        return attr.templateUrl ? attr.templateUrl : 'templates/viewer/pdf.html';
      },
      link: function(scope, element, attrs) {
        element.css('display', 'block');
        var url = scope.pdfUrl;
        var httpHeaders = scope.httpHeaders;
        var pdfDoc = null;
        var pageToDisplay = isFinite(attrs.page) ? parseInt(attrs.page) : 1;
        var pageFit = attrs.scale === 'page-fit';
        var scale = attrs.scale > 0 ? attrs.scale : 1;
        var canvasid = attrs.canvasid || 'pdf-canvas';
        var canvas = document.getElementById(canvasid);

        debug = attrs.hasOwnProperty('debug') ? attrs.debug : false;
        var creds = attrs.usecredentials;
        var ctx = canvas.getContext('2d');
        var windowEl = angular.element($window);

        windowEl.on('scroll', function() {
          scope.$apply(function() {
            scope.scroll = windowEl[0].scrollY;
          });
        });

        PDFJS.disableWorker = true;
        scope.pageNum = pageToDisplay;

        /*

           create a module to get rid of this multi call for
           data.

        */
            scope.getQuestions = function (addr,pageNumberToShow){

              var data = {
                 id: addr,
                 pagenumber: pageNumberToShow
              }
                //get data from db for questions,
                // make a class to deal with this instead
    $http.post("api/index.php/getquestions",data).success(function(response){


      console.log(response)

        scope.questions = response.questions;
        scope.answers = response.answers;


        //error call this will show error if it happens
    }).error(function(error){

        console.log("error:" + erorr)
    });
    };

      scope.postQuestion = function(a,b){

            var username = "";
            if (a == undefined) {
                username = "anonymous";
            }
            else {
                username = a;
            }
            var data = {
                name: username,
                question: b,
                tok: scope.pageadress,
                pagenum: scope.pageToDisplay

            }
            $http.post("api/index.php/addquestion", data).success(function (response) {
              console.log(response)
                //console.log("Question Added.");

            }).error(function (error) {
                console.log("Something went wrong");
            });

      }


       scope.postAnswer = function (answer, id) {
        var data = {
            answer: answer,
            unqiueId: scope.pageadress,
            id: id,
            slideid: scope.pageToDisplay
        }

        $http.post('api/index.php/addanswer', data).success(function (response) {
            console.log(response);
            scope.getQuestions(scope.pageadress,scope.pageToDisplay);
            //get all questions
        });
    }

        scope.renderPage = function(num) {
          if (renderTask) {
              renderTask._internalRenderTask.cancel();
          }

          pdfDoc.getPage(num).then(function(page) {
            var viewport;
            var pageWidthScale;
            var renderContext;

            if (pageFit) {
              viewport = page.getViewport(1);
              var clientRect = element[0].getBoundingClientRect();
              pageWidthScale = clientRect.width / viewport.width;
              scale = pageWidthScale;
            }
            viewport = page.getViewport(scale);

            setCanvasDimensions(canvas, viewport.width, viewport.height);

            renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };

            renderTask = page.render(renderContext);
            renderTask.promise.then(function() {
                if (typeof scope.onPageRender === 'function') {
                    scope.onPageRender();
                }
            }).catch(function (reason) {
                console.log(reason);
            });
          });

            // add class instance here to get rid of multi call problem
            // during traficc load
             //get page questions
          scope.getQuestions(scope.pageadress,scope.pageToDisplay);
        };

        scope.goPrevious = function() {
          if (scope.pageToDisplay <= 1) {
            return;
          }
          scope.pageToDisplay = parseInt(scope.pageToDisplay) - 1;
          scope.pageNum = scope.pageToDisplay;
             //get page questions
          scope.getQuestions(scope.pageadress,scope.pageToDisplay);
        };

        scope.goNext = function() {
          if (scope.pageToDisplay >= pdfDoc.numPages) {
            return;
          }
          scope.pageToDisplay = parseInt(scope.pageToDisplay) + 1;
          scope.pageNum = scope.pageToDisplay;
          //get page questions
          scope.getQuestions(scope.pageadress,scope.pageToDisplay);
        };

        scope.goTo = function(pageNumber){

            scope.pageNum = parseInt(pageNumber);
        }

        scope.zoomIn = function() {
          pageFit = false;
          scale = parseFloat(scale) + 0.2;
          scope.renderPage(scope.pageToDisplay);
          return scale;
        };

        scope.scaleTo = function(amount){
            pageFit = false;
            scale = parseFloat(amount) + 0.2;
            scope.renderPage(scope.pageToDisplay);
           return scale;
        }
        scope.zoomOut = function() {
          pageFit = false;
          scale = parseFloat(scale) - 0.2;
          scope.renderPage(scope.pageToDisplay);
          return scale;
        };

        scope.fit = function() {
          pageFit = true;
          scope.renderPage(scope.pageToDisplay);
        }

        scope.changePage = function() {
          scope.renderPage(scope.pageToDisplay);
        };

        scope.rotate = function() {
          if (canvas.getAttribute('class') === 'rotate0') {
            canvas.setAttribute('class', 'rotate90');
          } else if (canvas.getAttribute('class') === 'rotate90') {
            canvas.setAttribute('class', 'rotate180');
          } else if (canvas.getAttribute('class') === 'rotate180') {
            canvas.setAttribute('class', 'rotate270');
          } else {
            canvas.setAttribute('class', 'rotate0');
          }
        };

        function clearCanvas() {
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }

        function renderPDF() {
          clearCanvas();

          var params = {
            'url': url,
            'withCredentials': creds
          };

          if (httpHeaders) {
            params.httpHeaders = httpHeaders;
          }

          if (url && url.length) {
            pdfLoaderTask = PDFJS.getDocument(params, null, null, scope.onProgress);
            pdfLoaderTask.then(
                function(_pdfDoc) {
                  if (typeof scope.onLoad === 'function') {
                    scope.onLoad();
                  }

                  pdfDoc = _pdfDoc;
                  scope.renderPage(scope.pageToDisplay);

                  scope.$apply(function() {
                    scope.pageCount = _pdfDoc.numPages;
                  });
                }, function(error) {
                  if (error) {
                    if (typeof scope.onError === 'function') {
                      scope.onError(error);
                    }
                  }
                }
            );
          }
        }

        scope.$watch('pageNum', function(newVal) {
          scope.pageToDisplay = parseInt(newVal);
          if (pdfDoc !== null) {
            scope.renderPage(scope.pageToDisplay);
          }
        });

        scope.$watch('pdfUrl', function(newVal) {
          if (newVal !== '') {
            if (debug) {
              console.log('pdfUrl value change detected: ', scope.pdfUrl);
            }
            url = newVal;
            scope.pageNum = scope.pageToDisplay = pageToDisplay;
            if (pdfLoaderTask) {
                pdfLoaderTask.destroy().then(function () {
                    renderPDF();
                });
            } else {
                renderPDF();
            }
          }
        });

      }
    };
  } ]);
})();
