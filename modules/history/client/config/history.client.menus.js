menuConfig.$inject = ['menuService'];
export default function menuConfig(menuService) {
  menuService.addMenuItem('topbar', {
    title: 'Logs',
    state: 'logs',
    position: 9,
    roles: ['*'],
    type: 'dropdown'
  });

  var logObjects = ['Role', 'Token', 'Program', 'Schema', 'Request', 'ConfigurationFile'];
  var adminOnlyObjects = ['Role', 'Token', 'Program', 'Schema', 'ConfigurationFile'];

  logObjects.forEach(function (logObject, logObjectIndex) {
    var permissionRoles = (adminOnlyObjects.includes(logObject)) ? ['superAdmin', 'admin'] : ['*'];
    var hrefName = logObject.charAt(0).toLowerCase() + logObject.slice(1) + 's';
    var menuTitle = logObject.replace(/([a-z])([A-Z])/g, '$1-$2') + ' Logs';
    menuService.addSubMenuItem('topbar', 'logs', {
      title: menuTitle,
      state: 'logs.list',
      params: { objType: hrefName },
      position: logObjectIndex + 1,
      roles: permissionRoles
    });
  });
}
