import _ from 'lodash';
import { formatDate, generateEmailElement } from '../../../core/client/controllers/helpers.client.controller';
var $ = require('jquery');
var commonController = require('../../../core/client/controllers/common-list.client.controller');
require('datatables')();
require('datatables.net-scroller')(window, $);

RequestsListController.$inject = ['$scope', '$state', '$window', 'Authentication', 'Notification', '$compile', '$timeout', 'programs', 'requests', 'schemas', 'requestsHistory'];
// eslint-disable-next-line max-len
export default function RequestsListController($scope, $state, $window, Authentication, Notification, $compile, $timeout, programs, requests, schemas, requestsHistory) {
  var vm = this;
  vm.artifactType = 'Request';
  vm.artifactTypeLower = `${vm.artifactType.toLowerCase()}s`;
  vm.visibleArtifacts = requests;
  vm.requests = requests;
  requests = requests.map(function (request) {
    request.schema = schemas.find(schema => schema._id === request.schema_id);
    request.program = programs.find(program => program._id === request.program_id);
    request.history = requestsHistory.find(history => history.associated_id === request._id);
    return request;
  });

  vm.dataTableColumns = [
    {
      title: 'Name',
      data: null,
      render: function (data) {
        var htmlElement = `<a ui-sref="requests.view({ requestId: '${data._id}' })">${data.name}</a>`;
        return $compile(htmlElement)($scope)[0].outerHTML;
      }
    },
    {
      title: 'Schema Name',
      data: null,
      render: function (data) {
        if (data.schema) return data.schema.name;
      }
    },
    {
      title: 'Program Name',
      data: null,
      render: function (data) {
        if (data.program) return data.program.name;
      }
    },
    {
      title: 'Created By',
      data: null,
      render: function (data) {
        return (data.history) ? generateEmailElement('Request', data.name, data.history.createdBy) : 'UNKNOWN USER';
      }
    },
    {
      title: 'Created At',
      data: null,
      render: function (data) {
        return (data.created_at) ? formatDate(data.created_at) : 'UNKNOWN DATE';
      }
    },
    {
      title: 'Actions',
      orderable: false,
      searchable: false,
      width: '175px',
      data: null,
      render: function (data) {
        var viewElement = `<a class="btn btn-sm btn-info" ui-sref="requests.view({ requestId: '${data._id}' })">View</a>`;
        var compiledView = $compile(viewElement)($scope)[0].outerHTML;
        var deleteElement = '<a class="delete-button btn btn-sm btn-danger">Delete</a>'; // No compile needed on a non-angular element
        return `${compiledView}&nbsp;${deleteElement}`;
      }
    }
  ];
  commonController($scope, $window, Authentication, Notification, vm);
}
