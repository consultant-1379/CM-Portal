AuthenticationController.$inject = ['$scope', '$state', 'UsersService', '$location', 'Authentication', 'Notification'];
export default function AuthenticationController($scope, $state, UsersService, $location, Authentication, Notification) {
  var vm = this;
  vm.authentication = Authentication;
  document.body.classList.add('eaLogin-Background');

  // If user is signed in then redirect back home
  if (vm.authentication.user) {
    $location.path('/');
  }

  vm.signin = function () {
    UsersService.userSignin(vm.credentials)
      .then(onUserSigninSuccess)
      .catch(onUserSigninError);
  };

  function onUserSigninSuccess(response) {
    location.reload(); // eslint-disable-line no-restricted-globals
    document.body.classList.remove('eaLogin-Background');
    $scope.showNavBar(true);
    vm.authentication.user = response;
    $state.go('home');
  }

  function onUserSigninError(response) {
    Notification.error({
      message: response.data.message.replace(/\n/g, '<br/>'),
      title: '<i class="glyphicon glyphicon-remove"></i> Signin Error!',
      delay: 6000
    });
  }
}
