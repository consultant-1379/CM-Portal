menuConfig.$inject = ['menuService'];
export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Products',
    state: 'products',
    position: 8,
    roles: ['admin', 'superAdmin'],
    type: 'dropdown'
  });
  menuService.addSubMenuItem('topbar', 'products', {
    title: 'Create',
    state: 'products.create',
    position: 0,
    roles: ['admin', 'superAdmin']
  });
  menuService.addSubMenuItem('topbar', 'products', {
    title: 'Update',
    state: 'productsUpdate.create',
    position: 1,
    roles: ['admin', 'superAdmin']
  });
}
