menuConfig.$inject = ['menuService'];
export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Users',
    state: 'users.list',
    position: 2,
    roles: ['admin', 'superAdmin']
  });
}
