import _ from 'lodash';
var commonController = require('../../../core/client/controllers/common-list.client.controller');

ConfigurationFilesListController.$inject = ['$scope', '$compile', '$window', 'Notification', 'allConfigurationFiles', 'Authentication'];
export default function ConfigurationFilesListController($scope, $compile, $window, Notification, allConfigurationFiles, Authentication) {
  var vm = this;
  vm.artifactType = 'Configuration File';
  vm.artifactTypeLower = 'configurationFiles';
  vm.visibleArtifacts = allConfigurationFiles;
  vm.dataTableColumns = [
    {
      title: 'Name',
      data: null,
      width: '40%',
      render: function (data) {
        var htmlElement = `<a ui-sref="configurationFiles.view({ configurationFileId: '${data._id}' })">${data.name}</a>`;
        return $compile(htmlElement)($scope)[0].outerHTML;
      }
    },
    {
      title: 'Type',
      data: 'type',
      width: '10%'
    },
    {
      title: 'Version',
      data: 'version',
      width: '10%'
    },
    {
      title: 'Additional Info',
      data: 'additionalInfo',
      width: '40%'
    },
    {
      title: 'Location(s)',
      data: 'locations',
      width: '40%'
    },
    {
      title: 'Actions',
      orderable: false,
      searchable: false,
      width: '250px',
      data: null,
      render: function (data) {
        var downloadElement = '<a class="download-button btn btn-sm btn-success">Download</a>';
        var viewElement = `<a class="btn btn-sm btn-info" ui-sref="configurationFiles.view({ configurationFileId: '${data._id}' })">View</a>`;
        var compiledView = $compile(viewElement)($scope)[0].outerHTML;
        var editElement = `<a class="btn btn-sm btn-primary" ui-sref="configurationFiles.edit({ configurationFileId: '${data._id}' })">Edit</a>`;
        var compiledEdit = $compile(editElement)($scope)[0].outerHTML;
        var deleteElement = '<a class="delete-button btn btn-sm btn-danger">Delete</a>'; // No compile needed on a non-angular element
        return `${downloadElement}&nbsp;${compiledView}&nbsp;${compiledEdit}&nbsp;${deleteElement}`;
      }
    }
  ];
  commonController($scope, $window, Authentication, Notification, vm);
}
