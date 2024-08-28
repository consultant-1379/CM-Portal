menuConfig.$inject = ['menuService'];
export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'User Roles',
    state: 'roles.list',
    position: 1,
    roles: ['admin', 'superAdmin']
  });
}
