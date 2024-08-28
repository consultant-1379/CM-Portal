export default function menuService() {
  var shouldRender;
  var service = {
    addMenu: addMenu,
    addMenuItem: addMenuItem,
    addSubMenuItem: addSubMenuItem,
    defaultRoles: ['user', 'admin'],
    getMenu: getMenu,
    menus: {},
    removeMenu: removeMenu,
    removeMenuItem: removeMenuItem,
    removeSubMenuItem: removeSubMenuItem,
    validateMenuExistence: validateMenuExistence
  };

  init();

  return service;

  // Add new menu object by menu id
  function addMenu(menuId, options) {
    options = options || {};

    // Create the new menu
    service.menus[menuId] = {
      roles: options.roles || service.defaultRoles,
      items: options.items || [],
      shouldRender: shouldRender
    };

    // Return the menu object
    return service.menus[menuId];
  }

  // Add menu item object
  function addMenuItem(menuId, options) {
    options = options || {};

    // Validate that the menu exists
    service.validateMenuExistence(menuId);

    // Push new menu item
    service.menus[menuId].items.push({
      title: options.title || '',
      state: options.state || '',
      type: options.type || 'item',
      class: options.class,
      roles: ((options.roles === null || typeof options.roles === 'undefined') ? service.defaultRoles : options.roles),
      position: options.position || 0,
      items: [],
      shouldRender: shouldRender
    });

    // Add submenu items
    if (options.items) {
      options.items.forEach(function (item, itemIndex) {
        if (Object.prototype.hasOwnProperty.call(options.items, itemIndex)) {
          service.addSubMenuItem(menuId, options.state, item);
        }
      });
    }

    // Return the menu object
    return service.menus[menuId];
  }

  // Add submenu item object
  function addSubMenuItem(menuId, parentItemState, options) {
    options = options || {};

    // Validate that the menu exists
    service.validateMenuExistence(menuId);

    // Search for menu item
    service.menus[menuId].items.forEach(function (item) {
      if (item.state === parentItemState) {
        // Push new submenu item
        item.items.push({
          title: options.title || '',
          state: options.state || '',
          params: options.params || {},
          roles: ((options.roles === null || typeof options.roles === 'undefined') ? item.roles : options.roles),
          position: options.position || 0,
          shouldRender: shouldRender
        });
      }
    });

    // Return the menu object
    return service.menus[menuId];
  }

  // Get the menu object by menu id
  function getMenu(menuId) {
    // Validate that the menu exists
    service.validateMenuExistence(menuId);

    // Return the menu object
    return service.menus[menuId];
  }

  function init() {
    // A private function for rendering decision
    shouldRender = function (user, userRole) {
      if (this.roles.indexOf('*') !== -1) return true;
      if (!user) return false;
      if (userRole) {
        // Check for Default Roles Menu Rendering Value
        for (var roleIndex in this.roles) {
          if (Object.prototype.hasOwnProperty.call(this.roles, roleIndex) && this.roles[roleIndex] === userRole.name) {
            return true;
          }
        }
        // Check for User Special Permissions
        var specialPerm = user.permissions.some(perm => {
          var str = perm.resources.replace(/\//, '');
          return (this.state.indexOf(str) !== -1);
        });

        // Check for New Roles Permissions
        var newRolePerm = userRole.pathsPermissions.some(perm => {
          var str = perm.resources.replace(/\//, '');
          return (this.state.indexOf(str) !== -1);
        });
        return specialPerm + newRolePerm;
      }
    };

    // Adding the topbar menu
    addMenu('topbar', {
      roles: ['*']
    });
  }

  // Remove existing menu object by menu id
  function removeMenu(menuId) {
    // Validate that the menu exists
    service.validateMenuExistence(menuId);

    delete service.menus[menuId];
  }

  // Remove existing menu object by menu id
  function removeMenuItem(menuId, menuItemState) {
    // Validate that the menu exists
    service.validateMenuExistence(menuId);

    // Search for menu item to remove

    service.menus[menuId].items.forEach(function (item, itemIndex) {
      if (Object.prototype.hasOwnProperty.call(service.menus[menuId].items, itemIndex) &&
        service.menus[menuId].items[itemIndex].state === menuItemState) {
        service.menus[menuId].items.splice(itemIndex, 1);
      }
    });

    // Return the menu object
    return service.menus[menuId];
  }

  // Remove existing menu object by menu id
  function removeSubMenuItem(menuId, submenuItemState) {
    // Validate that the menu exists
    service.validateMenuExistence(menuId);

    // Search for menu item to remove
    for (var itemIndex in service.menus[menuId].items) {
      if (Object.prototype.hasOwnProperty.call(this.menus[menuId].items, itemIndex)) {
        for (var subitemIndex in service.menus[menuId].items[itemIndex].items) {
          if (Object.prototype.hasOwnProperty.call(this.menus[menuId].items[itemIndex].items, subitemIndex)
            && service.menus[menuId].items[itemIndex].items[subitemIndex].state === submenuItemState) {
            service.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
          }
        }
      }
    }

    // Return the menu object
    return service.menus[menuId];
  }

  // Validate menu existance
  function validateMenuExistence(menuId) {
    if (menuId && menuId.length) {
      if (service.menus[menuId]) {
        return true;
      }
      throw new Error('Menu does not exist');
    } else {
      throw new Error('MenuId was not provided');
    }
  }
}
