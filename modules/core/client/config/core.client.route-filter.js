import { checkMimerStatus } from '../../../core/client/controllers/helpers.client.controller';
routeFilter.$inject = ['$rootScope', '$state', '$http', 'Authentication', '$transitions', 'Notification', 'RolesService'];
export default function routeFilter($rootScope, $state, $http, Authentication, $transitions, Notification, RolesService) {
  // Used to indicate to the UI that the page is transitioning so that loading screens can appear
  var mimerPages = ['requests.create', 'productsUpdate.create', 'products.create'];

  // Default Pages open for all users.
  var userPages = ['home', 'logs.list', 'requests.create', 'requests.list', 'requests.view'];

  $transitions.onError({}, function () {
    $rootScope.transitioning = false;
  });

  $transitions.onBefore({}, async function (trans) {
    if (trans.to().name !== 'authentication.signin') {
      var rolesId = (Authentication.user) ? Authentication.user.role_id : undefined;
      var allRoles = await RolesService.query({ fields: '_id,name,pathsPermissions' }).$promise;
      var role = allRoles.find(role => role._id === rolesId);
      if (!rolesId) {
        $state.previous = {
          to: Object.assign({}, trans.to()),
          params: Object.assign({}, trans.params())
        };
        return trans.router.stateService.target('authentication.signin');
      }

      // Check if Page open for all users
      var openPages = userPages.indexOf(trans.to().name) !== -1;
      // Check against Role Permissions
      var rolePermissions = role.pathsPermissions.some(perm => {
        var str = perm.resources.replace(/\//, '');
        return ((trans.to().name).indexOf(str) !== -1);
      });
      // Check against User Special Permissions
      var specialPermissions = Authentication.user.permissions;
      var checkSpecialPermissions = specialPermissions.some(perm => {
        var permissionStr = perm.resources.replace(/\//, '');
        return ((trans.to().name).indexOf(permissionStr) !== -1);
      });
      if (!openPages && !checkSpecialPermissions && !rolePermissions && (role.name !== 'superAdmin')) {
        Notification.error({
          title: '<i class="glyphicon glyphicon-remove"></i>Unauthorized!',
          message: 'You do not have valid permissions to access this page.'
        });
        return trans.router.stateService.target('home');
      }
      // Check For Mimer Operations lock
      var mimerOperationsEnabled = await checkMimerStatus($http);
      var lockMimerOperations = !mimerOperationsEnabled.data;
      if (lockMimerOperations && mimerPages.indexOf(trans.to().name) !== -1) {
        Notification.error({
          title: '<i class="glyphicon glyphicon-remove"></i>Unauthorized!',
          message: 'Mimer functionality currently disabled due to Mimer authentication issue.'
        });
        return trans.router.stateService.target('home');
      }
    }
  });

  $transitions.onStart({}, function (trans) {
    $rootScope.transitioning = true;
  });

  $transitions.onSuccess({}, function (trans) {
    $rootScope.transitioning = false;
  });
}
