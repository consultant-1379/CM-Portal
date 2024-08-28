RolesViewController.$inject = ['role', 'allUsers'];
export default function RolesViewController(role, allUsers) {
  var vm = this;
  vm.role = role;
  vm.dependentUsers = allUsers.filter(user => user.role_id === vm.role._id);
}
