var commonController = require('../../../core/client/controllers/common-list.client.controller');

TokensListController.$inject = [
  '$scope', '$compile', '$window', 'Notification', 'allTokens', 'Authentication', 'allTokenLogs'
];
export default function TokensListController($scope, $compile, $window, Notification, allTokens, Authentication, allTokenLogs) {
  var vm = this;
  vm.artifactType = 'Token';
  vm.artifactTypeLower = `${vm.artifactType.toLowerCase()}s`;
  allTokens.forEach(function (token) {
    token.history = allTokenLogs.find(log => log.associated_id === token._id);
  });

  vm.visibleArtifacts = allTokens;
  vm.dataTableColumns = [
    {
      title: 'Name',
      data: null,
      render: function (data) {
        var htmlElement = `<a ui-sref="tokens.view({ tokenId: '${data._id}' })">${data.name}</a>`;
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
        var viewElement = `<a class="btn btn-sm btn-info" ui-sref="tokens.view({ tokenId: '${data._id}' })">View</a>`;
        var compiledView = $compile(viewElement)($scope)[0].outerHTML;
        var editElement = `<a class="btn btn-sm btn-primary" ui-sref="tokens.edit({ tokenId: '${data._id}' })">Edit</a>`;
        var compiledEdit = $compile(editElement)($scope)[0].outerHTML;
        var deleteElement = '<a class="delete-button btn btn-sm btn-danger">Delete</a>'; // No compile needed on a non-angular element
        return `${compiledView}&nbsp;${compiledEdit}&nbsp;${deleteElement}`;
      }
    }
  ];
  commonController($scope, $window, Authentication, Notification, vm);
}
