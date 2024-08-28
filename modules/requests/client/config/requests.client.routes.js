import _ from 'lodash';
import ListController from '../controllers/requests-list.client.controller';
import CreateController from '../controllers/requests-create.client.controller';
import ViewController from '../controllers/requests-view.client.controller';
import CommonListTemplate from '../../../core/client/views/common-list.view.html';
import CreateTemplate from '../views/requests-create.client.view.html';
import ViewTemplate from '../views/requests-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];

export default function routeConfig($stateProvider) {
  $stateProvider
    .state('requests', {
      abstract: true,
      url: '/requests',
      template: '<ui-view/>'
    })
    .state('requests.list', {
      url: '',
      template: CommonListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        requests: getRequests,
        schemas: getSchemas,
        programs: getPrograms,
        requestsHistory: getRequestsHistory
      }
    })
    .state('requests.create', {
      url: '/create',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        request: newRequest,
        schemas: getSchemas,
        programs: getPrograms,
        restoredata: getRestoreData,
        creatingFromScratch: function () { return true; }
      }
    })
    .state('requests.view', {
      url: '/view/{requestId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        request: getRequest,
        schema: ['request', 'SchemasService', getSchema],
        program: ['schema', 'ProgramsService', getProgram]
      }
    });
}

getRestoreData.$inject = ['$stateParams'];
function getRestoreData($stateParams) {
  return $stateParams.restoreData;
}

getRequest.$inject = ['$stateParams', 'RequestsService', 'SchemasService'];
async function getRequest($stateParams, RequestsService, SchemasService) {
  var request = await RequestsService.get({
    requestId: $stateParams.requestId
  }).$promise;
  var schema = await SchemasService.get({
    schemaId: request.schema_id
  }).$promise;
  if (schema.content.properties.parameters) {
    request.content.parameters = await sortObjectKeys(request.content.parameters, schema);
  }
  return request;
}

async function sortObjectKeys(obj, schema) {
  var sortedObj = {};
  if (!obj) return sortedObj;
  var schemaKeys = Object.keys(schema.content.properties.parameters.properties);
  schemaKeys.forEach(function (key) {
    sortedObj[key] = obj[key];
  });
  return sortedObj;
}

newRequest.$inject = ['RequestsService'];
function newRequest(RequestsService) {
  return new RequestsService();
}

getSchemas.$inject = ['SchemasService'];
function getSchemas(SchemasService) {
  return SchemasService.query({ q: 'type=projectRequest', fields: '_id,name,content,program_id' }).$promise;
}

function getProgram(schema, ProgramsService) {
  return ProgramsService.get({ programId: schema.program_id }).$promise;
}

getPrograms.$inject = ['ProgramsService'];
function getPrograms(ProgramsService) {
  return ProgramsService.query({}).$promise;
}

function getSchema(request, SchemasService) {
  return SchemasService.get({ schemaId: request.schema_id }).$promise;
}

getRequests.$inject = ['RequestsService'];
function getRequests(RequestsService) {
  return RequestsService.query({}).$promise;
}

getRequestsHistory.$inject = ['RequestsHistoryService'];
async function getRequestsHistory(RequestsHistoryService) {
  return RequestsHistoryService.query({}).$promise;
}
