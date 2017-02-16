angular.module('bluebank.controllers', ['ui.mask', 'ui.utils.masks'])
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
    username: '',
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
    user.set("cpf", signupForm.cpf);

    var Agencia = Parse.Object.extend('Agency');
    buscaAgencia = new Parse.Query(Agencia);
    buscaAgencia.equalTo("agencyCode", signupForm.agency);

    var Accounts = Parse.Object.extend("Account");
    var account = new Accounts();

    user.signUp(null, {

      success: function(user) {

        $timeout(function() {
          $scope.doingSignup = false;
        }, 1);

        account.set("accountOwner", user);
        account.set("accountNumber", signupForm.numeroContaCorrente);
        account.set("balanceAvailable", 1000);
        account.save().then(function(account){
          user.set("accountId", account);
        });

        buscaAgencia.first().then(function(agency){
          var relacao = agency.relation('clients');
          relacao.add(user);
          user.set("agency", agency);
          user.save();
          agency.save();
        });

        var alertPopup = $ionicPopup.alert({
          title: 'Sucesso!',
          template: 'Cadastro feito com sucesso!'
        });

        alertPopup.then(function(res) {
          $timeout(function() {
            Parse.User.logOut();
          }, 5000);
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

.controller('HomeCtrl', function($ionicLoading, $ionicHistory, $scope, $state, $ionicPopup, $timeout) {
  // This a temporary solution to solve an issue where the back button is displayed when it should not be.
  $ionicHistory.clearHistory();

  var user = Parse.User.current();
  var Users = Parse.Object.extend('User');
  var Accounts = Parse.Object.extend('Account');
  var buscaAccount = new Parse.Query(Accounts);
  var owner;
  buscaAccount.equalTo('accountOwner', user);
  buscaAccount.first().then(function(result){
    $timeout(function(){
      $scope.saldo = result.get('balanceAvailable').toFixed(2);
      owner = result;
    }, 0);
  });

  var buscaReceiver = new Parse.Query(Accounts);
  var Agencias = Parse.Object.extend('Agency');
  var buscaAgencia = new Parse.Query(Agencias);

  $scope.doTransaction = function(transferForm){
    var confirmPopup = $ionicPopup.confirm({
      title: 'Confirmar dados',
      subTitle: 'Verifique os dados abaixo para validar a transferência',
      template: "<div class='row row-center'>CPF: <b>"+transferForm.cpf+"</b></div>"+
                "<div class='row row-center'>Número da Conta: <b>"+transferForm.numeroContaCorrente+"</b></div>"+
                "<div class='row row-center'>Agência: <b>"+transferForm.agency+"</b></div>"+
                "<div class='row row-center'>Valor: <b>"+parseFloat(transferForm.quantity).toFixed(2)+"</b></div>",
      cancelText: 'Cancelar',
      cancelType: 'button-assertive',
      okText: 'Confirmar',
      okType: 'button-balanced',
    });

    confirmPopup.then(function(res){
      if (res){

        buscaReceiver.equalTo('accountNumber', transferForm.numeroContaCorrente);
        buscaAgencia.equalTo('agencyCode', transferForm.agency);
        buscaAgencia.first().then(function(agency){
          var relacao = agency.relation('clients');
          var buscaUser = relacao.query();
          buscaUser.equalTo('cpf', transferForm.cpf);
          buscaUser.first().then(function(user){
            buscaReceiver.equalTo('accountOwner', user);
          });
        });
        buscaReceiver.first().then(function(account){
          var Transactions = Parse.Object.extend('Transaction');
          var transaction = new Transactions();
          transaction.set('moneyTransferred', transferForm.quantity);
          transaction.set('fromOwner', owner);
          if(account && parseFloat($scope.saldo) - transferForm.quantity >= 0){
            transaction.set('toReceiver', account);
            transaction.set('transSuccessful', true);
            owner.set('balanceAvailable', parseFloat($scope.saldo) - transferForm.quantity);
            account.increment('balanceAvailable', transferForm.quantity);
            var alertPopup = $ionicPopup.alert({
              title: 'Transação realizada',
              template: 'Transação realizada com sucesso!'
            });
            alertPopup.then(function(res){
              $timeout(function(){
                $scope.saldo = owner.get('balanceAvailable').toFixed(2);
              }, 3);
            });
          }
          else {
            transaction.set('transSuccessful', false);
            alertPopup = $ionicPopup.alert({
              title: 'Transação mal-sucedida',
              template: 'Não há saldo ou os dados estão errados.'
            });
          }
          transaction.save().then(function(transaction){
            var relationTrans = account.relation('transactionsDone');
            relationTrans.add(transaction);
            account.save();
            relationTrans = owner.relation('transactionsDone');
            relationTrans.add(transaction);
            owner.save();
          });
        });
      }
    });
  }

})

.controller('LogoutCtrl', function($scope, $ionicHistory, $state, usertypeService) {

  $scope.logout = function() {
    Parse.User.logOut().then(function(){
      $ionicHistory.nextViewOptions({
        disableBack: true
      });
      $state.go('app.login');
    });
  };

  $scope.voltarPagina = function(){
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go('app.home');
  };
})