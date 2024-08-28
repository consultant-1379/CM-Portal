var commonController = require('../../../core/client/controllers/common-list.client.controller');

ProductsUpdatesListController.$inject = [
  '$scope', '$compile', '$window', 'Notification', 'allProductsUpdates', 'Authentication', 'allRoles'];
export default function ProductsUpdatesListController($scope, $compile, $window, Notification, allProductsUpdates, Authentication, allRoles) {
  var vm = this;
  vm.artifactType = 'Products Update';
  vm.artifactTypeLower = 'productsUpdate';
  var userIsSuperAdmin = (allRoles.find(role => role.name === 'superAdmin'))._id === Authentication.user.role_id;
  vm.visibleArtifacts = allProductsUpdates;
  vm.dataTableColumns = [
    {
      title: 'Update Time',
      data: null,
      render: function (data) {
        var htmlElement = `<a ui-sref="productsUpdate.view({ productsUpdateId: '${data._id}' })">${data.name}</a>`;
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
        var viewElement = `<a class="btn btn-sm btn-info" ui-sref="productsUpdate.view({ productsUpdateId: '${data._id}' })">View</a>`;
        var compiledView = $compile(viewElement)($scope)[0].outerHTML;
        var deleteElement = (userIsSuperAdmin) ? '<a class="delete-button btn btn-sm btn-danger">Delete</a>' : '';
        return `${compiledView}&nbsp${deleteElement}`;
      }
    }
  ];
  commonController($scope, $window, Authentication, Notification, vm);
}
