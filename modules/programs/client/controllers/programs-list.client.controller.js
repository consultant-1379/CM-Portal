import _ from 'lodash';
var commonController = require('../../../core/client/controllers/common-list.client.controller');

ProgramsListController.$inject = ['$scope', '$compile', '$window', 'Notification', 'allPrograms', 'Authentication'];
export default function ProgramsListController($scope, $compile, $window, Notification, allPrograms, Authentication) {
  var vm = this;
  vm.artifactType = 'Program';
  vm.artifactTypeLower = `${vm.artifactType.toLowerCase()}s`;
  vm.visibleArtifacts = allPrograms;
  vm.dataTableColumns = [
    {
      title: 'Name',
      data: null,
      render: function (data) {
        var htmlElement = `<a ui-sref="programs.view({ programId: '${data._id}' })">${data.name}</a>`;
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
        var viewElement = `<a class="btn btn-sm btn-info" ui-sref="programs.view({ programId: '${data._id}' })">View</a>`;
        var compiledView = $compile(viewElement)($scope)[0].outerHTML;
        var editElement = `<a class="btn btn-sm btn-primary" ui-sref="programs.edit({ programId: '${data._id}' })">Edit</a>`;
        var compiledEdit = $compile(editElement)($scope)[0].outerHTML;
        var deleteElement = '<a class="delete-button btn btn-sm btn-danger">Delete</a>'; // No compile needed on a non-angular element
        return `${compiledView}&nbsp;${compiledEdit}&nbsp;${deleteElement}`;
      }
    }
  ];
  commonController($scope, $window, Authentication, Notification, vm);
}
