UsersEditController.$inject = ['$scope', '$state', 'user', 'Notification', '$window', 'allRoles', 'Authentication'];

export default function UsersEditController($scope, $state, user, Notification, $window, allRoles, Authentication) {
  var vm = this;
  vm.user = user;
  vm.roles = allRoles;

  // Hide superAdmin Role option from roles menu if user is not a superAdmin
  var loggedInUserRoleId = Authentication.user.role_id;
  var superAdminRoleId = (vm.roles.find(role => role.name === 'superAdmin'))._id;
  var superAdminRoleIndex = vm.roles.map(role => role.name).indexOf('superAdmin');
  if (loggedInUserRoleId !== superAdminRoleId) vm.roles.splice(superAdminRoleIndex, 1);
  vm.role = vm.roles.filter(role => role._id === vm.user.role_id)[0];

  $scope.methods = ['get', 'put', 'post', 'delete'];

  // Toggle selection for permission methods
  $scope.optionSelected = function optionSelected(methodName, index) {
    var idx = vm.user.permissions[index].methods.search(methodName);
    if (idx > -1) {
      vm.user.permissions[index].methods = vm.user.permissions[index].methods.replace(methodName, '');
    } else {
      vm.user.permissions[index].methods = vm.user.permissions[index].methods.concat(' ', methodName);
    }
  };

  // Permissions Variable
  if (!vm.user.permissions || vm.user.permissions.length === 0) {
    vm.user.permissions = [];
  }

  // Add Permission functions
  vm.addPermission = function () {
    vm.user.permissions.push({ resources: '', methods: '' });
  };

  vm.removePermission = function (permissionIndex) {
    var permission = vm.user.permissions[permissionIndex];
    if ($window.confirm(`Are you sure you want to remove "${permission.methods}" Permission for path : "${permission.resources}"?`)) {
      vm.user.permissions.splice(permissionIndex, 1);
    }
  };

  vm.submitForm = async function () {
    try {
      vm.formSubmitting = true;
      user.role_id = vm.role._id;
      await user.$update();
    } catch (err) {
      vm.formSubmitting = false;
      var message = err.data ? err.data.message : err.message;
      Notification.error({ message: message.replace(/\n/g, '<br/>'), title: '<i class="glyphicon glyphicon-remove"></i> User Update error!' });
      return;
    }
    $state.go('users.view', { userId: vm.user._id });
    Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> User update successful!' });
  };
}
