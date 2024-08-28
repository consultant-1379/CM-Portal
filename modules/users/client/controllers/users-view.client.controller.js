UsersViewController.$inject = ['user', 'allRoles'];
export default function UsersViewController(user, allRoles) {
  var vm = this;
  vm.user = user;
  vm.roles = allRoles;
  vm.role = vm.roles.find(role => role._id === vm.user.role_id);
}
