angular.module('bluebank.controllers', ['ui.mask'])
.controller('AppCtrl', function($scope, $state, $ionicModal) {

  $ionicModal.fromTemplateUrl('templates/login.html', function(modal) {
      $scope.loginModal = modal;
    },
    {
      scope: $scope,
      animation: 'slide-in-up',
      focusFirstInput: true
    }
  );

  $scope.$on('$destroy', function() {
    $scope.loginModal.remove();
  });
})

.controller('LoginCtrl', function($ionicSideMenuDelegate, $scope, $state, $ionicHistory, $timeout, $ionicPopup, usertypeService) {
  $ionicSideMenuDelegate.canDragContent(false);

  $scope.user = {
    username: null,
    password: ''
  };

  var isUser;

  $scope.login = function(user) {
    $timeout(function() {
      $scope.doingLogin = true;
    }, 0);

    Parse.User.logIn($scope.user.username.toLowerCase(), $scope.user.password, {
      success: function(user) {
        $timeout(function() {
          $scope.doingLogin = false;
          $scope.user.password = null;
        }, 3);

        $ionicHistory.nextViewOptions({
          disableBack: true
        });
        $state.go('app.home');
      },
      error: function(user, error) {
        $timeout(function() {
          $scope.doingLogin = false;
        }, 3);

        if(error.code == 200) message = "Por favor, insira seu e-mail."
        else if(error.code == 101) message = "Usuário ou senha incorreta. Tente novamente ou clique em \"Esqueci a senha\"."
        else message = "Algo deu errado. Por favor, tente novamente."
        alert("Erro! " + message);
      }
    });
  };

  $scope.recuperarSenha = function(user) {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Procedimento para recuperar a senha',
      template: 'Para recuperar sua senha, um e-mail com os próximos passos será enviado para o endereço no login. Deseja prosseguir?',
      cancelText: 'Não',
      okText: 'Sim'
    });

    confirmPopup.then(function(res) {
      if(res) {
        Parse.User.requestPasswordReset($scope.user.username, {
          success: function() {
            var alertPopup = $ionicPopup.alert({
              title: 'E-mail enviado!',
              template: 'O e-mail para você recuperar sua senha foi enviado.'
            });

            alertPopup.then(function(res) {
              console.log('e-mail enviado com sucesso!');
            });
          },
          error: function(error) {
            var alertPopup = $ionicPopup.alert({
              title: 'Erro!',
              template: 'O e-mail não existe ou está incorreto.'
            });

            alertPopup.then(function(res) {
              console.log('e-mail não encontrado!');
            });
            console.log("Error: " + error.code + " " + error.message);
          }
        });
      }else {
        console.log('O usuário desistiu de resetar a senha.');
      }
    });
  };

  $scope.telaCadastro = function() {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go('app.signup');
  };

})

.controller('SignupCtrl', function($ionicHistory, $scope, $state, $ionicPopup, $timeout) {
  $scope.closeSignup = function(){
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go('app.login');
  };

  $scope.doSignup = function(signupForm){
    $timeout(function() {
      $scope.doingSignup = true;
    }, 0);
    var user = new Parse.User();

    user.set("name", signupForm.name);
    user.set("username", signupForm.email.toLowerCase());
    user.set("password", signupForm.password);
    user.set("email", signupForm.email);
    user.set("numeroContaCorrente", signupForm.numeroContaCorrente);
    user.set("cpf", signupForm.cpf);

    var Agencia = Parse.Object.extend("Agency");
    buscaAgencia = new Parse.Query(Agencia);
    buscaAgencia.equalTo('agencyCode', signupForm.agencyCode)
    buscaAgencia.first().then(function(result){
      user.set("agencyCode", result);
    })

    user.signUp(null, {

      success: function(user) {

        $timeout(function() {
          $scope.doingSignup = false;
        }, 1);

        var alertPopup = $ionicPopup.alert({
          title: 'Sucesso!',
          template: 'Cadastro feito com sucesso!'
        });

        alertPopup.then(function(res) {
          Parse.User.logOut();
          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          $state.go('app.login');
        });
      },
      
      error: function(user, error) {
        $timeout(function() {
          $scope.doingSignup = false;
        }, 1);
        if(error.code == 100) message = "Sua internet falhou. Por favor, tente novamente."
        else if(error.code == 202) message = "E-mail já cadastrado. Se não lembrar a sua senha, clique em 'Esqueci a senha'"
        else message = "Ocorreu um erro ao efetuar seu cadastro. Por favor, tente novamente."

        alert("Erro " + error.code + ": " + error.message);
      }
    });
  };
})