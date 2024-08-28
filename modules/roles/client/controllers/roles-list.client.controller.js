var commonController = require('../../../core/client/controllers/common-list.client.controller');

RolesListController.$inject = [
  '$scope', '$compile', '$window', 'Notification', 'allRoles', 'Authentication', 'allRoleLogs'
];
export default function RolesListController($scope, $compile, $window, Notification, allRoles, Authentication, allRoleLogs) {
  var vm = this;
  vm.artifactType = 'Role';
  vm.artifactTypeLower = `${vm.artifactType.toLowerCase()}s`;
  allRoles.forEach(function (role) {
    role.history = allRoleLogs.find(log => log.associated_id === role._id);
  });
  var superAdminRoleId = (allRoles.find(role => role.name === 'superAdmin'))._id;
  var loggedInUserRoleId = Authentication.user.role_id;

  vm.visibleArtifacts = allRoles;
  vm.dataTableColumns = [
    {
      title: 'Name',
      data: null,
      render: function (data) {
        // eslint-disable-next-line max-len
        var htmlElement = (data._id === superAdminRoleId && superAdminRoleId !== loggedInUserRoleId) ? `<a>${data.name}</a>` : `<a ui-sref="roles.view({ roleId: '${data._id}' })">${data.name}</a>`;
        return $compile(htmlElement)($scope)[0].outerHTML;
      }
    },
    {
      title: 'Actions',
      orderable: false,
      searchable: false,
      width: '175px',
      data: null,
      render: function (data) {
        var viewElement = `<a class="btn btn-sm btn-info" ui-sref="roles.view({ roleId: '${data._id}' })">View</a>`;
        var compiledView = $compile(viewElement)($scope)[0].outerHTML;
        var editElement = `<a class="btn btn-sm btn-primary" ui-sref="roles.edit({ roleId: '${data._id}' })">Edit</a>`;
        var compiledEdit = $compile(editElement)($scope)[0].outerHTML;
        var deleteElement = '<a class="delete-button btn btn-sm btn-danger">Delete</a>'; // No compile needed on a non-angular element
        if (data._id === superAdminRoleId && superAdminRoleId !== loggedInUserRoleId) return '<a></a>';
        return `${compiledView}&nbsp;${compiledEdit}&nbsp;${deleteElement}`;
      }
    }
  ];
  commonController($scope, $window, Authentication, Notification, vm);
}
