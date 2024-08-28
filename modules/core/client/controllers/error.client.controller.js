ErrorController.$inject = ['$stateParams'];

export default function ErrorController($stateParams) {
  var vm = this;

  // Display custom message if it was set
  if ($stateParams.message) vm.errorMessage = $stateParams.message;
}
