angular.module('starter', ['ionic', 'bluebank.controllers', 'bluebank.services', 'ngCordova'])
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
  });
})
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html"
    })
    .state('app.signup', {
      url: "/signup",
      views: {
        'menuContent' : {
          templateUrl: "templates/signup.html",
          controller: 'SignupCtrl'
        }
      }
    })
    .state('app.login', {
      url: "/login",
      views: {
        'menuContent' : {
          templateUrl: "templates/login.html"
        }
      }
    });

  $urlRouterProvider.otherwise("/app/login");
});