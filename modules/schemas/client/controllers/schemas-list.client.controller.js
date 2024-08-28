import _ from 'lodash';

var $ = require('jquery');
require('datatables')();
require('datatables.net-scroller')(window, $);
var commonController = require('../../../core/client/controllers/common-list.client.controller');
var helpersController = require('../../../core/client/controllers/helpers.client.controller');

SchemasListController.$inject = ['$scope', 'Authentication', '$window', 'Notification', '$compile', 'schemas', 'allPrograms'];

export default function SchemasListController($scope, Authentication, $window, Notification, $compile, schemas, allPrograms) {
  var vm = this;
  vm.artifactType = 'Schema';
  vm.artifactTypeLower = `${vm.artifactType.toLowerCase()}s`;

  vm.visibleArtifacts = schemas;

  schemas = schemas.map(function (schema) {
    schema.program = allPrograms.find(program => program._id === schema.program_id);
    return schema;
  });

  vm.dataTableColumns = [
    {
      title: 'Name',
      data: null,
      render: function (data) {
        var htmlElement = `<a ui-sref="schemas.view({ schemaId: '${data._id}' })">${data.name}</a>`;
        return $compile(htmlElement)($scope)[0].outerHTML;
      }
    },
    {
      title: 'Type',
      data: 'type'
    },
    {
      title: 'Program',
      data: null,
      render: function (data) {
        if (data.program_id) {
          var htmlElement = `<a ui-sref="programs.view({ programId: '${data.program_id}' })">${data.program.name}</a>`;
          return $compile(htmlElement)($scope)[0].outerHTML;
        }
      }
    },
    {
      title: 'Created At',
      data: null,
      render: function (data) {
        return helpersController.formatDate(data.created_at);
      }
    },
    {
      title: 'Actions',
      orderable: false,
      searchable: false,
      width: '175px',
      data: null,
      render: function (data) {
        var viewElement = `<a class="btn btn-sm btn-info" ui-sref="schemas.view({ schemaId: '${data._id}' })">View</a>`;
        var compiledView = $compile(viewElement)($scope)[0].outerHTML;
        var editElement = `<a class="btn btn-sm btn-primary" ui-sref="schemas.edit({ schemaId: '${data._id}' })">Edit</a>`;
        var compiledEdit = $compile(editElement)($scope)[0].outerHTML;
        var deleteElement = '<a class="delete-button btn btn-sm btn-danger">Delete</a>'; // No compile needed on a non-angular element
        return `${compiledView}&nbsp;${compiledEdit}&nbsp;${deleteElement}`;
      }
    }
  ];
  commonController($scope, $window, Authentication, Notification, vm);
}

