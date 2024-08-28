var commonController = require('../../../core/client/controllers/common-list.client.controller');

UsersListController.$inject = [
  '$scope', '$window', 'Notification', 'allUsers', 'Authentication', 'allRoles', '$compile'
];
export default function UsersListController($scope, $window, Notification, allUsers, Authentication, allRoles, $compile) {
  var vm = this;
  vm.roles = allRoles;
  var superAdminRoleId = (allRoles.find(role => role.name === 'superAdmin'))._id;
  var loggedInUserRoleId = Authentication.user.role_id;

  vm.artifactType = 'User';
  vm.artifactTypeLower = 'users';

  allUsers.forEach(user => { user.name = user.displayName; });
  vm.visibleArtifacts = allUsers;

  vm.dataTableColumns = [
    {
      title: 'Signum',
      data: null,
      render: function (data) {
        // eslint-disable-next-line max-len
        var htmlElement = (data.role_id === superAdminRoleId && superAdminRoleId !== loggedInUserRoleId) ? `<a>${data.username}</a>` : `<a ui-sref="users.view({ userId: '${data._id}' })">${data.username}</a>`;
        return $compile(htmlElement)($scope)[0].outerHTML;
      }
    },
    {
      title: 'Name',
      data: 'displayName'
    },
    {
      title: 'Account Type',
      data: null,
      render: function (data) {
        var role = vm.roles.filter(role => role._id === data.role_id);
        return role[0].name;
      }
    },
    {
      title: 'Actions',
      orderable: false,
      searchable: false,
      width: '175px',
      data: null,
      render: function (data) {
        var viewElement = `<a class="btn btn-sm btn-info" ui-sref="users.view({ userId: '${data._id}' })">View</a>`;
        var editElement = `<a class="btn btn-sm btn-info" ui-sref="users.edit({ userId: '${data._id}' })">Edit</a>`;
        var compiledEdit = $compile(editElement)($scope)[0].outerHTML;
        var compiledView = $compile(viewElement)($scope)[0].outerHTML;
        if (data.role_id === superAdminRoleId && superAdminRoleId !== loggedInUserRoleId) return '<a></a>';
        return `${compiledView}&nbsp;${compiledEdit}&nbsp;`;
      }
    }
  ];
  commonController($scope, $window, Authentication, Notification, vm);
}
