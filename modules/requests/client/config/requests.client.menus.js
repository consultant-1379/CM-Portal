menuConfig.$inject = ['menuService'];
export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Requests',
    state: 'requests.list',
    position: 6,
    roles: ['*']
  });
}
