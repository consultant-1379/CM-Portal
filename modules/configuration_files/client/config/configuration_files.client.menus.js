menuConfig.$inject = ['menuService'];
export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Configuration Files',
    state: 'configurationFiles.list',
    position: 8,
    roles: ['superAdmin']
  });
}
