menuConfig.$inject = ['menuService'];
export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Mimer Token',
    state: 'tokens.list',
    position: 3,
    roles: ['admin', 'superAdmin']
  });
}
