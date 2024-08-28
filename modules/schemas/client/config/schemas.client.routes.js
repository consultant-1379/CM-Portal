import ListController from '../controllers/schemas-list.client.controller';
import CreateController from '../controllers/schemas-create.client.controller';
import ViewController from '../controllers/schemas-view.client.controller';
import CommonListTemplate from '../../../core/client/views/common-list.view.html';
import CreateTemplate from '../views/schemas-create.client.view.html';
import ViewTemplate from '../views/schemas-view.client.view.html';

routeConfig.$inject = ['$stateProvider'];
export default function routeConfig($stateProvider) {
  $stateProvider
    .state('schemas', {
      abstract: true,
      url: '/schemas',
      template: '<ui-view/>'
    })
    .state('schemas.list', {
      url: '',
      template: CommonListTemplate,
      controller: ListController,
      controllerAs: 'vm',
      resolve: {
        schemas: getSchemas,
        allPrograms: getAllPrograms
      }
    })
    .state('schemas.create', {
      url: '/create?{restoreData:json}',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        schema: newSchema,
        restoredata: getRestoreData,
        allPrograms: getAllPrograms,
        creatingFromScratch: function () { return true; }
      }
    })
    .state('schemas.view', {
      url: '/view/{schemaId}',
      template: ViewTemplate,
      controller: ViewController,
      controllerAs: 'vm',
      resolve: {
        schema: getSchema,
        program: ['schema', 'ProgramsService', getProgram]
      }
    })
    .state('schemas.edit', {
      url: '/edit/{schemaId}?{restoreData:json}?',
      template: CreateTemplate,
      controller: CreateController,
      controllerAs: 'vm',
      resolve: {
        schema: getSchema,
        allPrograms: getAllPrograms,
        restoredata: getRestoreData,
        clonedata: function () { return null; },
        creatingFromScratch: function () { return false; }
      }
    });
}

getRestoreData.$inject = ['$stateParams'];
function getRestoreData($stateParams) {
  return $stateParams.restoreData;
}

getSchema.$inject = ['$stateParams', 'SchemasService'];
function getSchema($stateParams, SchemasService) {
  return SchemasService.get({
    schemaId: $stateParams.schemaId
  }).$promise;
}

getSchemas.$inject = ['SchemasService'];
function getSchemas(SchemasService) {
  return SchemasService.query({}).$promise;
}

newSchema.$inject = ['SchemasService'];
function newSchema(SchemasService) {
  return new SchemasService();
}

getAllPrograms.$inject = ['ProgramsService'];
function getAllPrograms(programsService) {
  return programsService.query().$promise;
}

function getProgram(schema, ProgramsService) {
  return ProgramsService.get({ programId: schema.program_id }).$promise;
}
