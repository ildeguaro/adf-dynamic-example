/*
 * The MIT License
 *
 * Copyright (c) 2014, Sebastian Sdorra
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';


var app = angular.module('adfDynamicSample', [
    'adf', 'ngRoute', 'adf.structures.base',
    'adf.widget.clock', 'adf.widget.github', 'adf.widget.iframe',
    'adf.widget.linklist', 'adf.widget.markdown', 'adf.widget.news',
    'adf.widget.randommsg', 'adf.widget.version', 'adf.widget.weather'
  ]);

  var userId = 1;
  app.value('userId',this.userId);
  app.constant('urlUserApi', 'http://localhost:3000/api/users/');
  app.constant('urlDashboardApi','http://localhost:3000/api/users/'+this.userId+'/dashboard');
  app.value('dashboardInicial',{
            "did":"",
            "title": "Mi Dashboard",
            "structure": "4-8",
            "titleTemplateUrl": "../src/templates/dashboard-title.html",
            "rows": [{
                "columns": [{
                  "styleClass": "col-md-4",
                  "widgets": []
                },{
                  "styleClass": "col-md-8",
                  "widgets": []
                }]
              }]
            }
  );


  app.config(function($routeProvider){
    $routeProvider
      .when('/boards', {
        templateUrl: 'partials/default.html'
      })
      .when('/boards/:id', {
        controller: 'dashboardCtrl',
        controllerAs: 'dashboard',
        templateUrl: 'partials/dashboard.html',
        resolve: {
          data: function($route, storeService){
            return storeService.get($route.current.params.id);
          }
        }
      })
      .when('/user',{
        controller: 'dashboardCtrl',
        controllerAs: 'dashboard',
        templateUrl: 'partials/dashboard.html',
        resolve: {
          data: function($route, userService){
            return userService.getDashboard(userId).then(function(data){
              return data.content[0]; // Dado que entrega una lista, para el ejemplo dibujara el primero
            });
          }
        }

      })

      .otherwise({
        redirectTo: '/boards'
      });
  });



  app.service('userService',function($http,$q,urlUserApi, urlDashboardApi){
    return {
      get:function(idUser){
        var deferred = $q.defer();
        $http.get(urlUserApi+idUser)
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(){
              deferred.reject();
            });
        return deferred.promise;
      },
      getDashboard:function(idUser){
        var deferred = $q.defer();
        $http.get(urlUserApi+idUser+'/dashboard')
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(){
              deferred.reject();
            });
        return deferred.promise;
      },

      createDashboard: function(data){
        var deferred = $q.defer();
        $http.post(urlDashboardApi+'/create', data)
            .success(function(data){
              deferred.resolve();
            })
            .error(function(){
              deferred.reject();
            });
        return deferred.promise;
      },

      saveDashboard: function(data){
        var deferred = $q.defer();
        $http.post(urlDashboardApi+'/save', data)
            .success(function(data){
              deferred.resolve();
            })
            .error(function(){
              deferred.reject();
            });
        return deferred.promise;
      },
      deleteDashboard:function(idUser, dashboardId){
        var deferred = $q.defer();
        $http.delete(urlUserApi+idUser+'/dashboards/'+dashboardId)
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(){
              deferred.reject();
            });
        return deferred.promise;
      },

      getAll: function(){
        var deferred = $q.defer();
        $http.get(urlUserApi)
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(){
              deferred.reject();
            });
        return deferred.promise;
      }
    }
  })
  app.service('storeService', function($http, $q){
    return {
      getAll: function(){
        var deferred = $q.defer();
        $http.get('/v1/store')
          .success(function(data){
            deferred.resolve(data.dashboards);
          })
          .error(function(){
            deferred.reject();
          });
        return deferred.promise;
      },
      get: function(id){
        var deferred = $q.defer();
        $http.get('/v1/store/' + id)
          .success(function(data){
            deferred.resolve(data);
          })
          .error(function(){
            deferred.reject();
          });
        return deferred.promise;
      },
      set: function(id, data){
        var deferred = $q.defer();
        $http.post('/v1/store/' + id, data)
          .success(function(data){
            deferred.resolve();
          })
          .error(function(){
            deferred.reject();
          });
        return deferred.promise;
      },
      delete: function(id){
        var deferred = $q.defer();
        $http.delete('/v1/store/' + id)
          .success(function(data){
            deferred.resolve(data);
          })
          .error(function(){
            deferred.reject();
          });
        return deferred.promise;
      }
    };
  });


  app.controller('navigationCtrl', function($scope, $q, $location, $window, storeService, userService, dashboardInicial){
    var nav = this;
    nav.navCollapsed = true;
    nav.currentUser;


    userService.get(userId).then(function(data){
      nav.currentUser = data;
    });

    this.toggleNav = function(){
      nav.navCollapsed = ! nav.navCollapsed;
    };

    this.navClass = function(page) {
      var currentRoute = $location.path().substring(1);
      return page === currentRoute || new RegExp(page).test(currentRoute) ? 'active' : '';
    };


    this.createDashboard=function(){
       dashboardInicial.did = '_' + new Date().getTime();
       userService.createDashboard(dashboardInicial);
       $window.location="#/user";

    };


    storeService.getAll().then(function(data){
      nav.items = data;
    });

    $scope.$on('navChanged', function(){
      storeService.getAll().then(function(data){
        nav.items = data;
      });
    });
  });

  app.controller('dashboardCtrl', function($location, $rootScope, $scope, $routeParams,
                                           $window, storeService, userService, data, userId){
    this.name = $routeParams.id;
    this.model =  data;

    this.delete = function(id){
      userService.deleteDashboard(userId,this.model.id);
      $window.location="#/boards";

    };

    $scope.$on('adfDashboardChanged', function(event, name, model) {

      userService.saveDashboard(model);
      $window.location="#/user";

    });

    $scope.$on('adfOpenDialogWidgets', function(event,addScope,widgets) {

      var lista =  [{name:"clock",
          title: 'Clock',
          description: 'Displays date and time',
          templateUrl: '{widgetsPath}/clock/src/view.html',
          controller: 'clockController',
          controllerAs: 'clock',
          config: {
              timePattern: 'HH:mm:ss',
              datePattern: 'YYYY-MM-DD'
          },
          edit: {
              templateUrl: '{widgetsPath}/clock/src/edit.html'
          }}];


     //addScope.widgets = lista;
    });


  });