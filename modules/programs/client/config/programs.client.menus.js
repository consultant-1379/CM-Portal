menuConfig.$inject = ['menuService'];
export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Programs',
    state: 'programs.list',
    position: 4,
    roles: ['superAdmin']
  });
}
